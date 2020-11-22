import type { Event, Effect, Store, Unit, Subscription } from 'effector'
import {
  clearNode,
  createDomain,
  createEvent,
  createStore,
  forward,
  guard,
  is,
  sample,
  withRegion,
} from 'effector'

export interface StorageAdapter {
  <State>(key: string, update: (raw?: any) => any): {
    set(value: State): void
    get(value?: any): State | Promise<State>
  }
  keyArea?: any
}

export type Done<State> = {
  key: string
  operation: 'set' | 'get'
  value: State
}

export type Fail<Err> = {
  key: string
  operation: 'set' | 'get'
  error: Err
  value?: any
}

export type Finally<State, Err> =
  | (Done<State> & { status: 'done' })
  | (Fail<Err> & { status: 'fail' })

export type ConfigStore<State, Err = Error> = {
  adapter: StorageAdapter
  store: Store<State>
  done?: Unit<Done<State>>
  fail?: Unit<Fail<Err>>
  finally?: Unit<Finally<State, Err>>
  pickup?: Unit<any>
  key?: string
}

export type ConfigSourceTarget<State, Err = Error> = {
  adapter: StorageAdapter
  source: Store<State> | Event<State> | Effect<State, any, any>
  target: Store<State> | Event<State> | Effect<State, any, any>
  done?: Unit<Done<State>>
  fail?: Unit<Fail<Err>>
  finally?: Unit<Finally<State, Err>>
  pickup?: Unit<any>
  key?: string
}

/**
 * Keys areas / namespaces cache
 */
const areas = new Map<any, Map<string, Store<any>>>()

/**
 * Get store, responsible for the key in key area / namespace
 */
function getStorageArea<State>(keyArea: any, key: string): Store<State> {
  let area = areas.get(keyArea)
  if (area === undefined) {
    area = new Map()
    areas.set(keyArea, area)
  }

  let store = area.get(key)
  if (store !== undefined) {
    return store
  }

  store = createStore(null)
  area.set(key, store)

  return store
}

/**
 * Default sink for unhandled errors
 */
const sink = createEvent<Fail<any>>()
sink.watch((payload) => console.error(payload.error))

/**
 * Main root `persist` function
 */
export function persist<State, Err = Error>(
  config: ConfigStore<State, Err>
): Subscription
export function persist<State, Err = Error>(
  config: ConfigSourceTarget<State, Err>
): Subscription
export function persist<State, Err = Error>({
  adapter,
  store,
  source = store,
  target = store,
  done,
  fail = sink,
  finally: anyway,
  pickup,
  key,
}: Partial<
  ConfigStore<State, Err> & ConfigSourceTarget<State, Err>
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
  if (!key && source.shortName === (source as any).id) {
    throw Error('Key or name is not defined')
  }
  if (source === target && !is.store(source)) {
    throw Error('Source must be different from target')
  }

  key = key || source.shortName

  const storageArea = getStorageArea<State>(adapter.keyArea || adapter, key)

  const region = createDomain()
  const desist = () => clearNode(region)

  const getFx = region.effect<void, State, Err>()
  const setFx = region.effect<State, void, Err>()

  const localAnyway = region.event<Finally<State, Err>>()
  const localDone = localAnyway.filterMap<Done<State>>(
    ({ status, key, operation, value }) =>
      status === 'done' ? { key, operation, value } : undefined
  )
  const localFail = localAnyway.filterMap<Fail<Err>>(
    ({ status, key, operation, error, value }: any) =>
      status === 'fail' ? { key, operation, error, value } : undefined
  )

  const value = adapter<State>(key, getFx)

  const op = (operation: 'get' | 'set') => ({
    status,
    params,
    result,
    error,
  }: any): any =>
    status === 'done'
      ? { status, key, operation, value: result }
      : { status, key, operation, value: params, error }

  withRegion(region, () => {
    guard({
      source: sample<State, State, [State, State]>(
        storageArea,
        source,
        (current, proposed) => [proposed, current]
      ),
      filter: ([proposed, current]) => proposed !== current,
      target: setFx.prepend<[State, State]>(([proposed]) => proposed),
    })
    forward({ from: [getFx.doneData, setFx], to: storageArea })
    forward({ from: [getFx.doneData, storageArea], to: target })
    forward({
      from: [getFx.finally.map(op('get')), setFx.finally.map(op('set'))],
      to: localAnyway,
    })

    forward({ from: localFail, to: fail })
    done && forward({ from: localDone, to: done })
    anyway && forward({ from: localAnyway, to: anyway })

    pickup && forward({ from: pickup, to: getFx.prepend(() => undefined) })
  })

  getFx.use(value.get)
  setFx.use(value.set)

  // kick getter to pick up initial value from storage
  getFx()

  return (desist.unsubscribe = desist)
}
