import type { Event, Effect, Subscription } from 'effector'
import type {
  ConfigAdapter,
  ConfigAdapterFactory,
  ConfigPersist,
  ConfigSourceTarget,
  ConfigStore,
  Done,
  Fail,
  Finally,
  FinallyDone,
  FinallyFail,
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
import { validate } from './validate'

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
  let disposable: (_: any) => void = () => {}
  const desist = () => disposable(clearNode(region))

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
    const ctx = createStore<[any?]>(
      [is.store(context) ? context.defaultState : undefined],
      { serialize: 'ignore' }
    )

    const value = adapter<State>(keyPrefix + key, (x) => {
      update(x)
    })

    if (typeof value === 'function') {
      disposable = value
    }

    const getFx = attach({
      source: ctx,
      effect: ([ref], raw?: any) => value.get(raw, ref),
    }) as Effect<void, State, Err>

    const setFx = attach({
      source: ctx,
      effect: ([ref], state: State) => value.set(state, ref),
    }) as Effect<State, void, Err>

    const validateFx = createEffect<unknown, State>((raw) =>
      raw === undefined // `undefined` is always valid
        ? raw
        : validate(raw, contract)
    )

    const complete = createEvent<Finally<State, Err>>()

    const trigger = createEvent<State>()

    let update: (raw?: any) => any = getFx
    ctx.updates.watch(() => {
      update = scopeBind(getFx, { safe: true })
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

    sample({
      clock: [getFx.doneData as Event<any>, sample(setFx, setFx.done)],
      filter: (x) => x !== undefined,
      target: storage,
    })

    sample({
      clock: [getFx.doneData as Event<any>, storage],
      target: validateFx,
    })

    sample({
      clock: validateFx.doneData,
      filter: (x) => x !== undefined,
      target: target as any,
    })

    sample({
      clock: [
        getFx.finally.map(op('get')),
        setFx.finally.map(op('set')),
        validateFx.fail.map(op('validate')),
      ],
      target: complete,
    })

    // effector 23 introduced "targetable" types - UnitTargetable, StoreWritable, EventCallable
    // so, targeting non-targetable unit is not allowed anymore.
    // soothe typescript by casting to any for a while, until we drop support for effector 22 branch
    if (anyway) {
      sample({
        clock: complete,
        target: anyway as any,
      })
    }

    if (done) {
      sample({
        clock: complete,
        filter: (payload: Finally<State, Err>): payload is FinallyDone<State> =>
          payload.status === 'done',
        fn: ({ key, keyPrefix, operation, value }): Done<State> => ({
          key,
          keyPrefix,
          operation,
          value,
        }),
        target: done as any,
      })
    }

    sample({
      clock: complete,
      filter: (payload: Finally<State, Err>): payload is FinallyFail<Err> =>
        payload.status === 'fail',
      fn: ({ key, keyPrefix, operation, error, value }): Fail<Err> => ({
        key,
        keyPrefix,
        operation,
        error,
        value,
      }),
      target: fail as any,
    })

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
