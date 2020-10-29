import type { Event, Effect, Store, Unit, Subscription } from 'effector'
import { createEvent, createEffect, forward, is } from 'effector'

export interface StorageAdapter {
  <State>(key: string, update: (raw?: any) => any): {
    set(value: State): void
    get(value?: any): State | Promise<State>
  }
}

export type Exception<Fail = Error> = {
  readonly key: string
  readonly operation: 'set' | 'get'
  readonly error: Fail
  readonly value?: any
}

export type ConfigStore<State, Fail = Error> = {
  readonly with: StorageAdapter
  readonly store: Store<State>
  readonly fail?: Unit<Exception<Fail>>
  readonly key?: string
}

export type ConfigSourceTarget<State, Fail = Error> = {
  readonly with: StorageAdapter
  readonly source: Store<State> | Event<State> | Effect<State, any, any>
  readonly target: Store<State> | Event<State> | Effect<State, any, any>
  readonly fail?: Unit<Exception<Fail>>
  readonly key?: string
}

const cache = new Map<
  StorageAdapter,
  {
    [key: string]: [
      /* set */ Effect<any, any, any>,
      /* get */ Effect<any, any, any>,
      /* err */ Event<Exception<any>>
    ]
  }
>()

function createEffects<State, Fail = Error>(
  adapter: StorageAdapter,
  key: string
): [
  /* set */ Effect<State, void, Fail>,
  /* get */ Effect<void, State, Fail>,
  /* err */ Event<Exception<Fail>>
] {
  let cached = cache.get(adapter)
  if (cached) {
    if (cached[key]) {
      return cached[key]
    }
  } else {
    cache.set(adapter, (cached = {}))
  }

  const set = createEffect<State, void, Fail>()
  const get = createEffect<void, State, Fail>()
  const err = createEvent<Exception<Fail>>()
  const value = adapter<State>(key, get)

  const op = (operation: 'set' | 'get') => (payload: any) => ({
    key,
    operation,
    error: payload.error,
    value: payload.params,
  })

  forward({
    from: [set.fail.map(op('set')), get.fail.map(op('get'))],
    to: err,
  })

  set.use(value.set)
  get.use(value.get)
  return (cached[key] = [set, get, err])
}

// default sink for unhandled errors
export const sink = createEvent<Exception<any>>()

export function tie<State, Fail = Error>(config: ConfigStore<State, Fail>): Subscription
export function tie<State, Fail = Error>(config: ConfigSourceTarget<State, Fail>): Subscription
export function tie<State, Fail = Error>({
  with: adapter,
  store,
  source = store,
  target = store,
  fail = sink,
  key,
}: Partial<ConfigStore<State, Fail> & ConfigSourceTarget<State, Fail>>): Subscription {
  if (!adapter) {
    throw Error('Adapter is not defined')
  }
  if (!source) {
    throw Error('Store or source is not defined')
  }
  if (!target) {
    throw Error('Target is not defined')
  }
  if (source === target && !is.store(source)) {
    throw Error('Source must be different from target')
  }

  const [set, get, err] = createEffects<State, Fail>(adapter, key || source.shortName)

  const ties = [
    forward({ from: source, to: set }),
    forward({ from: [set, get.doneData], to: target }),
    forward({ from: err, to: fail }),
  ]

  const result = () => {
    ties.map((fn) => fn())
  }

  // kick getter to get initial state from storage
  get()

  return (result.unsubscribe = result)
}