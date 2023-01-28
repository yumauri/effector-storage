import type { Subscription } from 'effector'
import type {
  ConfigPersist,
  ConfigSourceTarget,
  ConfigStore,
  Done,
  Fail,
  Finally,
} from '../types'
import {
  clearNode,
  createEffect,
  createEvent,
  createNode,
  createStore,
  forward,
  guard,
  is,
  merge,
  sample,
  withRegion,
} from 'effector'
import { getAreaStorage } from './area'

// identity helper function,
// used instead of native serialization functions, if there are not defined
const identity = <T>(value: T) => value

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

  const sop =
    (operation: 'read' | 'write') =>
    ({ params, error }: any): any => ({
      status: 'fail',
      key,
      keyPrefix,
      operation,
      value: params,
      error,
    })

  // create all auxiliary units and nodes within the region,
  // to be able to remove them all at once on unsubscription
  withRegion(region, () => {
    const getFx = createEffect<void, State, Err>()
    const setFx = createEffect<State, void, Err>()
    const readFx = createEffect<State, State, Err>()
    const writeFx = createEffect<State, State, Err>()

    // @ts-expect-error due to old typings in import
    const raw = createStore<State>(null, { serialize: 'ignore' })

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

    const value = adapter<State>(keyPrefix + key, getFx)
    getFx.use(value.get)
    setFx.use(value.set)

    let read = identity
    let write = identity
    if (is.store(source)) {
      const serialize = (source as any).graphite.meta.serialize
      if (serialize && serialize.read && serialize.write) {
        read = serialize.read
        write = serialize.write
      }
    }
    readFx.use(read)
    writeFx.use(write)

    const trigger = createEvent<State>()
    sample({
      source,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      clock: clock!, // `clock` is always defined, as long as `source` is defined
      target: trigger,
    })

    guard({
      source: sample<State, State, [State, State]>(
        raw,
        trigger,
        (current, proposed) => [proposed, current]
      ),
      filter: ([proposed, current]) => proposed !== current,
      target: writeFx.prepend<[State, State]>(([proposed]) => proposed),
    })
    forward({ from: writeFx.doneData, to: setFx })
    forward({ from: [getFx.doneData, setFx], to: storage })
    sample({ source: merge([getFx.doneData, storage]), target: readFx })
    forward({ from: readFx.doneData, to: [target, raw] })

    forward({
      from: [
        getFx.finally.map(op('get')),
        setFx.finally.map(op('set')),
        readFx.fail.map(sop('read')),
        writeFx.fail.map(sop('write')),
      ],
      to: localAnyway,
    })

    forward({ from: localFail, to: fail })
    if (done) forward({ from: localDone, to: done })
    if (anyway) forward({ from: localAnyway, to: anyway })

    if (pickup) {
      // pick up value from storage ONLY on `pickup` update
      forward({ from: pickup, to: getFx.prepend(() => undefined) })
    } else {
      // kick getter to pick up initial value from storage
      getFx()
    }
  })

  return (desist.unsubscribe = desist)
}
