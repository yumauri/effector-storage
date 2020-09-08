//
// Type definitions
//

import { createStore, createEvent, Store, Event } from 'effector'

// there are no exported types for `createStore` and `createEvent`, so, infer it
type TStoreCreator = typeof createStore
type TEventCreator = typeof createEvent

// `type` declarations are replaced to `typeof ...` by 'rollup-plugin-dts'
// and in result there are confilting names `createStore` and `createEvent`
// in 'local/index.d.ts' and 'session/index.d.ts'
// so I define empty interfaces here instead
export interface StoreCreator extends TStoreCreator {} // eslint-disable-line @typescript-eslint/no-empty-interface
export interface EventCreator extends TEventCreator {} // eslint-disable-line @typescript-eslint/no-empty-interface

// there is no exported type for `createStore` config object, so, infer it
type StoreCreatorConfig = NonNullable<Parameters<StoreCreator>[1]>

export interface ErrorHandler {
  (error: any): void
}

export interface UpdateHandler {
  <State>(value: State): void
}

export interface StorageAdapterConfig {
  key: string
}

export interface StorageAdapter<AdapterConfig = StorageAdapterConfig> {
  <State>(
    defaultValue: State,
    config: AdapterConfig,
    on: {
      error: ErrorHandler
      update: UpdateHandler
    }
  ): {
    (): State | undefined // get value
    (value: State): void // set value
  }
}

export interface StorageStore<State> extends Store<State> {
  catch(handler: ErrorHandler): StorageStore<State>
}

export interface TiedStoreCreator<AdapterConfig = StorageAdapterConfig> {
  <State>(defaultState: State, config: StoreCreatorConfig & AdapterConfig): StorageStore<
    State
  >
}

export interface Config<AdapterConfig = StorageAdapterConfig> {
  with: StorageAdapter<AdapterConfig>
  using?: EventCreator | Event<any>
  [key: string]: any
}

export type ConfigEx<AdapterConfig = StorageAdapterConfig> = Config<AdapterConfig> &
  AdapterConfig

const isConfig = <T>(x: unknown): x is Config<T> =>
  typeof x === 'object' && x !== null && typeof (x as any).with === 'function'

function assert(x: unknown, message: string): asserts x {
  if (x === undefined) {
    throw new Error(message)
  }
}

//
// Tie overloads
//

export function tie<State, AdapterConfig = StorageAdapterConfig>(
  store: Store<State>,
  config: ConfigEx<AdapterConfig>,
  using?: EventCreator | Event<any>
): StorageStore<State>

export function tie<State, AdapterConfig = StorageAdapterConfig>(
  config: ConfigEx<AdapterConfig>,
  store: Store<State>,
  using?: EventCreator | Event<any>
): StorageStore<State>

export function tie<State>(
  store: Store<State>
): <AdapterConfig = StorageAdapterConfig>(
  config: ConfigEx<AdapterConfig>,
  using?: EventCreator | Event<any>
) => StorageStore<State>

export function tie<AdapterConfig = StorageAdapterConfig>(
  config: ConfigEx<AdapterConfig>
): <State>(store: Store<State>, using?: EventCreator | Event<any>) => StorageStore<State>

export function tie<AdapterConfig = StorageAdapterConfig>(
  createStore: StoreCreator,
  config: Config<AdapterConfig>,
  using?: EventCreator | Event<any>
): TiedStoreCreator<AdapterConfig>

export function tie<AdapterConfig = StorageAdapterConfig>(
  config: Config<AdapterConfig>,
  createStore: StoreCreator,
  using?: EventCreator | Event<any>
): TiedStoreCreator<AdapterConfig>

export function tie(
  createStore: StoreCreator
): <AdapterConfig = StorageAdapterConfig>(
  config: Config<AdapterConfig>,
  using?: EventCreator | Event<any>
) => TiedStoreCreator<AdapterConfig>

export function tie<AdapterConfig = StorageAdapterConfig>(
  config: Config<AdapterConfig>
): (
  createStore: StoreCreator,
  using?: EventCreator | Event<any>
) => TiedStoreCreator<AdapterConfig>

//
// Tie implementation
//

export function tie<State = void, AdapterConfig = StorageAdapterConfig>(
  arg1: StoreCreator | Store<State> | Config<AdapterConfig>,
  arg2?: StoreCreator | Store<State> | Config<AdapterConfig>,
  using?: EventCreator | Event<any>
): any {
  const curried = (
    arg2: StoreCreator | Store<State> | Config<AdapterConfig>,
    using?: EventCreator | Event<any>
  ) => {
    let creatorOrStore: StoreCreator | Store<State> | undefined
    let config: Config<AdapterConfig> | undefined
    let event: Event<any> | undefined

    isConfig<AdapterConfig>(arg1) ? (config = arg1) : (creatorOrStore = arg1)
    isConfig<AdapterConfig>(arg2) ? (config = arg2) : (creatorOrStore = arg2)

    assert(creatorOrStore, 'Store creator or store is not defined')
    assert(config, 'Config is not defined')

    using = using || config.using
    if (typeof using === 'function') {
      event = 'kind' in using ? using : using()
    }

    return typeof creatorOrStore === 'function'
      ? creator(creatorOrStore, config, event)
      : store(creatorOrStore, config as ConfigEx<AdapterConfig>, event)
  }

  return arg2 !== undefined ? curried(arg2, using) : curried
}

//
//
//

function creator<AdapterConfig>(
  createStore: StoreCreator,
  cfg: Config<AdapterConfig>,
  event?: Event<any>
): TiedStoreCreator<AdapterConfig> {
  return <State>(
    defaultState: State,
    config: StoreCreatorConfig & AdapterConfig
  ): StorageStore<State> => {
    const on = {
      error: (() => undefined) as ErrorHandler,
      update: (() => undefined) as UpdateHandler,
    }

    // initialize adapter
    const value = cfg.with(defaultState, Object.assign({}, cfg, config), on)

    // storage value
    const from = value()

    // create effector store, with rehydrated value
    const store = createStore<State>(from !== undefined ? from : defaultState, config)

    // manually set `defaultState` to have .reset method working correct
    store.defaultState = defaultState

    // add update event listener and update handler
    if (event) {
      store.on(event, (_, value) => value)
      on.update = event
    }

    // add error handler
    ;(store as any).catch = (handler: ErrorHandler) => {
      on.error = handler
      return store
    }

    // watch store changes, and save to storage
    store.watch(value)

    // return modified effector store
    return store as StorageStore<State>
  }
}

//
//
//

function store<State, AdapterConfig>(
  store: Store<State>,
  cfg: ConfigEx<AdapterConfig>,
  event?: Event<any>
): StorageStore<State> {
  const on = {
    error: (() => undefined) as ErrorHandler,
    update: (() => undefined) as UpdateHandler,
  }

  // current store value
  const current = store.getState()

  // initialize adapter
  const value = cfg.with(current, cfg, on)

  // storage value
  const from = value()

  // add update event listener and update handler
  if (event) {
    store.on(event, (_, value) => value)
    on.update = event

    if (from !== undefined && from !== current) {
      event(from) // push restored value to store
    }
  }

  // add error handler
  ;(store as any).catch = (handler: ErrorHandler) => {
    on.error = handler
    return store
  }

  // watch store changes, and save to storage
  store.watch(value)

  // return modified effector store
  return store as StorageStore<State>
}
