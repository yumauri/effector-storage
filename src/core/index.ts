import type { Effect, Subscription } from 'effector'
import type {
  ConfigPersist,
  ConfigSourceTarget,
  ConfigStore,
  Done,
  Fail,
  Finally,
} from '../types'
import {
  attach,
  clearNode,
  createEvent,
  createNode,
  createStore,
  forward,
  guard,
  is,
  merge,
  sample,
  scopeBind,
  withRegion,
} from 'effector'
import { getAreaStorage } from './area'

// helper function to swap two function arguments
// end extract current context from ref-box
const contextual =
  <T, C, R>(fn: (value: T, ctx?: C) => R) =>
  (ctx: { ref?: C }, value: T) =>
    fn(value, ctx.ref)

// helper function for safe bind effects to scope
// since version 22.4.0 there is `safe` option in `scopeBind`,
// but as long as effector-storage supports 22.0 this helper is required
const safeBind = (fx: Effect<any, any, any>) => {
  try {
    // @ts-expect-error due to old typings in import
    return scopeBind(fx, { safe: true })
  } catch (e) {
    return fx
  }
}

/**
 * Default sink for unhandled errors
 */
const sink = createEvent<Fail<any>>()
sink.watch((payload) => console.error(payload.error))

/**
 * Main `persist` function
 */
export function persist<State, Err = Error>({
  adapter,
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
}: Partial<
  ConfigPersist & ConfigStore<State, Err> & ConfigSourceTarget<State, Err>
>): Subscription {
  if (!adapter) {
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

  const key = keyName || source.shortName
  const storage = getAreaStorage<State>(
    adapter.keyArea || adapter,
    keyPrefix + key
  )
  const region = createNode()
  const desist = () => clearNode(region)

  const op =
    (operation: 'get' | 'set') =>
    ({ status, params, result, error }: any): any =>
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
            value: params,
            error,
          }

  // create all auxiliary units and nodes within the region,
  // to be able to remove them all at once on unsubscription
  withRegion(region, () => {
    const ctx = createStore<{ ref: any }>(
      { ref: undefined },
      { serialize: 'ignore' }
    )

    const value = adapter<State>(keyPrefix + key, (x) => bindedGet(x))

    const getFx = attach({
      source: ctx,
      effect: contextual(value.get),
    }) as any as Effect<void, State, Err>

    const setFx = attach({
      source: ctx,
      effect: contextual(value.set),
    }) as any as Effect<State, void, Err>

    let bindedGet: (raw?: any) => any = getFx
    ctx.updates.watch(() => {
      bindedGet = safeBind(getFx)
    })

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
    sample({
      source,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      clock: clock!, // `clock` is always defined, as long as `source` is defined
      target: trigger,
    })

    guard({
      source: sample(storage, trigger, (current, proposed) => [
        proposed,
        current,
      ]),
      filter: ([proposed, current]) => proposed !== current,
      target: setFx.prepend(([proposed]: State[]) => proposed),
    })
    forward({ from: [getFx.doneData, setFx], to: storage })
    sample({ source: merge([getFx.doneData, storage]), target: target as any })

    forward({
      from: [getFx.finally.map(op('get')), setFx.finally.map(op('set'))],
      to: localAnyway,
    })

    forward({ from: localFail, to: fail })
    if (done) forward({ from: localDone, to: done })
    if (anyway) forward({ from: localAnyway, to: anyway })

    if (context) {
      ctx.on(context, ({ ref }, payload) => ({
        ref: payload === undefined ? ref : payload,
      }))
    }

    if (pickup) {
      // pick up value from storage ONLY on `pickup` update
      forward({ from: pickup, to: getFx.prepend(() => undefined) })
      ctx.on(pickup, ({ ref }, payload) => ({
        ref: payload === undefined ? ref : payload,
      }))
    } else {
      // kick getter to pick up initial value from storage
      getFx()
    }
  })

  return (desist.unsubscribe = desist)
}
