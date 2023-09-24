import type { Effect, Subscription } from 'effector'
import type {
  ConfigAdapter,
  ConfigAdapterFactory,
  ConfigPersist,
  ConfigSourceTarget,
  ConfigStore,
  Contract,
  Done,
  Fail,
  Finally,
} from '../types'
import {
  attach,
  clearNode,
  createEvent,
  createEffect,
  createNode,
  createStore,
  is,
  sample,
  scopeBind,
  withRegion,
} from 'effector'
import { getAreaStorage } from './area'

// helper function to swap two function arguments
// end extract current context from ref-box
const contextual =
  <T, C, R>(fn: (value: T, ctx?: C) => R) =>
  ([ref]: [C?], value: T) =>
    fn(value, ref)

// helper function to validate data with contract
const contracted =
  <T>(contract?: Contract<T>) =>
  (raw: unknown) =>
    !contract || // no contract -> data is valid
    raw === undefined || // `undefined` is always valid
    ('isData' in contract ? contract.isData(raw) : contract(raw))
      ? (raw as T)
      : (() => {
          throw 'getErrorMessages' in contract
            ? contract.getErrorMessages(raw)
            : undefined
        })()

/**
 * Default sink for unhandled errors
 */
const sink = createEvent<Fail<any>>()
sink.watch((payload) => console.error(payload.error))

/**
 * Main `persist` function
 */
export function persist<State, Err = Error>(
  config: Partial<
    (ConfigAdapter | ConfigAdapterFactory<any>) &
      ConfigPersist &
      ConfigStore<State, Err> &
      ConfigSourceTarget<State, Err>
  >
): Subscription {
  const {
    adapter: adapterOrFactory,
    store,
    source = store,
    target = store,
    clock = source,
    done,
    fail = sink,
    finally: anyway,
    pickup,
    context,
    key: keyName,
    keyPrefix = '',
    contract,
  } = config

  if (!adapterOrFactory) {
    throw Error('Adapter is not defined')
  }
  if (!source) {
    throw Error('Store or source is not defined')
  }
  if (!target) {
    throw Error('Target is not defined')
  }
  if (!keyName && source.shortName === (source as any).id) {
    throw Error('Key or name is not defined')
  }
  if (source === target && !is.store(source)) {
    throw Error('Source must be different from target')
  }

  // get default value from store, if given
  // this is used in adapter factory
  if ((config as any).def === undefined && is.store(source)) {
    ;(config as any).def = source.defaultState
  }

  const adapter =
    'factory' in adapterOrFactory ? adapterOrFactory(config) : adapterOrFactory

  const key = keyName || source.shortName
  const storage = getAreaStorage<State>(
    adapter.keyArea || adapter,
    keyPrefix + key
  )
  const region = createNode()
  const desist = () => clearNode(region)

  const op =
    (operation: 'get' | 'set' | 'validate') =>
    ({ status = 'fail', params, result, error }: any): any =>
      status === 'done'
        ? {
            status,
            key,
            keyPrefix,
            operation,
            value: operation === 'get' ? result : params,
          }
        : {
            status,
            key,
            keyPrefix,
            operation,
            value: typeof params === 'function' ? undefined : params, // hide internal "box" implementation
            error,
          }

  // create all auxiliary units and nodes within the region,
  // to be able to remove them all at once on unsubscription
  withRegion(region, () => {
    const ctx = createStore<[any?]>([], { serialize: 'ignore' })

    const value = adapter<State>(keyPrefix + key, (x) => bindedGet(x))

    const getFx = attach({
      source: ctx,
      effect: contextual(value.get),
    }) as any as Effect<void, State, Err>

    const setFx = attach({
      source: ctx,
      effect: contextual(value.set),
    }) as any as Effect<State, void, Err>

    const validateFx = createEffect<unknown, State>(contracted(contract))

    const localAnyway = createEvent<Finally<State, Err>>()
    const localDone = localAnyway.filterMap<Done<State>>(
      ({ status, key, keyPrefix, operation, value }) =>
        status === 'done' ? { key, keyPrefix, operation, value } : undefined
    )
    const localFail = localAnyway.filterMap<Fail<Err>>(
      ({ status, key, keyPrefix, operation, error, value }: any) =>
        status === 'fail'
          ? { key, keyPrefix, operation, error, value }
          : undefined
    )

    const trigger = createEvent<State>()

    let bindedGet: (raw?: any) => any = getFx
    ctx.updates.watch(() => {
      bindedGet = scopeBind(getFx as any, { safe: true })
    })

    sample({
      clock, // `clock` is always defined, as long as `source` is defined
      source,
      target: trigger,
    } as any)

    sample({
      clock: trigger,
      source: storage,
      filter: (current, proposed) => proposed !== current,
      fn: (_, proposed) => proposed,
      target: setFx,
    })

    sample({ clock: [getFx.doneData, setFx], target: storage as any })
    sample({ clock: [getFx.doneData, storage], target: validateFx as any })
    sample({ clock: validateFx.doneData, target: target as any })

    sample({
      clock: [
        getFx.finally.map(op('get')),
        setFx.finally.map(op('set')),
        validateFx.fail.map(op('validate')),
      ],
      target: localAnyway,
    })

    if (anyway) sample({ clock: localAnyway, target: anyway })
    if (done) sample({ clock: localDone, target: done })
    sample({ clock: localFail, target: fail })

    if (context) {
      ctx.on(context, ([ref], payload) => [
        payload === undefined ? ref : payload,
      ])
    }

    if (pickup) {
      // pick up value from storage ONLY on `pickup` update
      sample({ clock: pickup, fn: () => undefined, target: getFx })
      ctx.on(pickup, ([ref], payload) => [
        payload === undefined ? ref : payload,
      ])
    } else {
      // kick getter to pick up initial value from storage
      getFx()
    }
  })

  return (desist.unsubscribe = desist)
}
