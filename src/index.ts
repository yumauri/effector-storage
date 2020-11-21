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

export type Failure<Fail> = {
  key: string
  operation: 'set' | 'get'
  error: Fail
  value?: any
}

export type Finally<State, Fail> =
  | (Done<State> & { status: 'done' })
  | (Failure<Fail> & { status: 'fail' })

export type ConfigStore<State, Fail = Error> = {
  adapter: StorageAdapter
  store: Store<State>
  done?: Unit<Done<State>>
  fail?: Unit<Failure<Fail>>
  finally?: Unit<Finally<State, Fail>>
  pickup?: Unit<any>
  key?: string
}

export type ConfigSourceTarget<State, Fail = Error> = {
  adapter: StorageAdapter
  source: Store<State> | Event<State> | Effect<State, any, any>
  target: Store<State> | Event<State> | Effect<State, any, any>
  done?: Unit<Done<State>>
  fail?: Unit<Failure<Fail>>
  finally?: Unit<Finally<State, Fail>>
  pickup?: Unit<any>
  key?: string
}

const areas = new Map<any, Map<string, Store<any>>>()

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

// default sink for unhandled errors
const sink = createEvent<Failure<any>>()
sink.watch((payload) => console.error(payload.error))

export function persist<State, Fail = Error>(
  config: ConfigStore<State, Fail>
): Subscription
export function persist<State, Fail = Error>(
  config: ConfigSourceTarget<State, Fail>
): Subscription
export function persist<State, Fail = Error>({
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
  ConfigStore<State, Fail> & ConfigSourceTarget<State, Fail>
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

  const getFx = region.effect<void, State, Fail>()
  const setFx = region.effect<State, void, Fail>()

  const _anyway = region.event<Finally<State, Fail>>()
  const _done = _anyway.filterMap<Done<State>>(
    ({ status, key, operation, value }) => {
      if (status === 'done') return { key, operation, value }
    }
  )
  const _fail = _anyway.filterMap<Failure<Fail>>(
    ({ status, key, operation, error, value }: any) => {
      if (status === 'fail') return { key, operation, error, value }
    }
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
      to: _anyway,
    })

    forward({ from: _fail, to: fail })
    done && forward({ from: _done, to: done })
    anyway && forward({ from: _anyway, to: anyway })

    pickup && forward({ from: pickup, to: getFx.prepend(() => undefined) })
  })

  getFx.use(value.get)
  setFx.use(value.set)

  // kick getter to pick up initial value from storage
  getFx()

  return (desist.unsubscribe = desist)
}
