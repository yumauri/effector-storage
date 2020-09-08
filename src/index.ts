import { createStore, createEvent, Store, Event } from 'effector'

type TStoreCreator = typeof createStore
type TEventCreator = typeof createEvent

// `type` declarations are replaced to `typeof ...` by 'rollup-plugin-dts'
// and in result there are confilting names `createStore` and `createEvent`
// in 'local/index.d.ts' and 'session/index.d.ts'
// so I define empty interfaces here instead
export interface StoreCreator extends TStoreCreator {} // eslint-disable-line @typescript-eslint/no-empty-interface
export interface EventCreator extends TEventCreator {} // eslint-disable-line @typescript-eslint/no-empty-interface

export interface ErrorHandler {
  (error: any): void
}

export interface UpdateHandler {
  <State>(value: State): void
}

export interface StorageAdapter {
  <State>(
    defaultValue: State,
    config: { [key: string]: any },
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

export interface TiedStoreCreator {
  <State>(defaultState: State, config: { [key: string]: any }): StorageStore<State>
}

export interface Config {
  with: StorageAdapter
  using?: EventCreator | Event<any>
  [key: string]: any
}

export interface ConfigEx extends Config {
  key: string
}

const isConfig = (x: unknown): x is Config =>
  typeof x === 'object' && x !== null && typeof (x as any).with === 'function'

function assert(x: unknown, message: string): asserts x {
  if (x === undefined) {
    throw new Error(message)
  }
}

//
// Tie overloads
//

export function tie<State>(
  store: Store<State>,
  config: ConfigEx,
  using?: EventCreator | Event<any>
): StorageStore<State>

export function tie<State>(
  config: ConfigEx,
  store: Store<State>,
  using?: EventCreator | Event<any>
): StorageStore<State>

export function tie<State>(
  store: Store<State>
): (config: ConfigEx, using?: EventCreator | Event<any>) => StorageStore<State>

export function tie(
  config: ConfigEx
): <State>(store: Store<State>, using?: EventCreator | Event<any>) => StorageStore<State>

export function tie(
  createStore: StoreCreator,
  config: Config,
  using?: EventCreator | Event<any>
): TiedStoreCreator

export function tie(
  config: Config,
  createStore: StoreCreator,
  using?: EventCreator | Event<any>
): TiedStoreCreator

export function tie(
  createStore: StoreCreator
): (config: Config, using?: EventCreator | Event<any>) => TiedStoreCreator

export function tie(
  config: Config
): (createStore: StoreCreator, using?: EventCreator | Event<any>) => TiedStoreCreator

//
// Tie implementation
//

export function tie<State = void>(
  arg1: StoreCreator | Store<State> | Config,
  arg2?: StoreCreator | Store<State> | Config,
  using?: EventCreator | Event<any>
): any {
  const curried = (
    arg2: StoreCreator | Store<State> | Config,
    using?: EventCreator | Event<any>
  ) => {
    let creatorOrStore: StoreCreator | Store<State> | undefined
    let config: Config | undefined
    let event: Event<any> | undefined

    isConfig(arg1) ? (config = arg1) : (creatorOrStore = arg1)
    isConfig(arg2) ? (config = arg2) : (creatorOrStore = arg2)

    assert(creatorOrStore, 'Store creator or store is not defined')
    assert(config, 'Config is not defined')

    using = using || config.using
    if (typeof using === 'function') {
      event = 'kind' in using ? using : using()
    }

    return typeof creatorOrStore === 'function'
      ? creator(creatorOrStore, config, event)
      : store(creatorOrStore, config as ConfigEx, event)
  }

  return arg2 !== undefined ? curried(arg2, using) : curried
}

//
//
//

function creator(
  createStore: StoreCreator,
  cfg: Config,
  event?: Event<any>
): TiedStoreCreator {
  return <State>(
    defaultState: State,
    config: { [key: string]: any }
  ): StorageStore<State> => {
    const on = {
      error: (() => undefined) as ErrorHandler,
      update: (() => undefined) as UpdateHandler,
    }

    // initialize adapter
    const value = cfg.with(defaultState, config, on)

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

function store<State>(
  store: Store<State>,
  cfg: ConfigEx,
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
