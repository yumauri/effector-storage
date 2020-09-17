import type { Store, Event, Domain } from 'effector'
import { createStore, createEvent, is } from 'effector'

/*
 * Helper utility types
 */

// https://stackoverflow.com/questions/52984808/is-there-a-way-to-get-all-required-properties-of-a-typescript-object
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K // eslint-disable-line @typescript-eslint/ban-types
}[keyof T]

// this type detector is from 'conditional-type-checks' library
// https://github.com/dsherret/conditional-type-checks/blob/01215056e8b97a28c5b0311b42ed48c70c8723fe/index.ts#L55
type IsAny<T> = 0 extends 1 & T ? true : false

// this type detector is from 'conditional-type-checks' library
// https://github.com/dsherret/conditional-type-checks/blob/01215056e8b97a28c5b0311b42ed48c70c8723fe/index.ts#L60
type IsNever<T> = [T] extends [never] ? true : false

// this type detector is from 'conditional-type-checks' library
// https://github.com/dsherret/conditional-type-checks/blob/01215056e8b97a28c5b0311b42ed48c70c8723fe/index.ts#L65
type IsUnknown<T> = IsNever<T> extends false
  ? T extends unknown
    ? unknown extends T
      ? IsAny<T> extends false
        ? true
        : false
      : false
    : false
  : false

// returns New type in case it is not <unknown>, otherwise returns Prev type
type Collect<Prev, New> = IsUnknown<New> extends true ? Prev : New

/*
 * Effector types
 */

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

/*
 * Library types
 */

export interface ErrorHandler {
  (error: any): void
}

export interface MandatoryAdapterConfig {
  readonly key: string
}

export interface StorageAdapter<AdapterConfig = void> {
  <State>(
    defaultValue: State,
    config: AdapterConfig & MandatoryAdapterConfig,
    on: {
      error: ErrorHandler
      update: Event<State>
    }
  ): {
    get(): State | undefined | void
    set(value: State): void
  }
}

export interface Config<AdapterConfig, State = any> extends MandatoryAdapterConfig {
  readonly with: StorageAdapter<AdapterConfig>
  readonly store?: Store<State>
  readonly using?: Event<State>
  readonly domain?: Domain
}

export interface StorageStore<State> extends Store<State> {
  catch(handler: ErrorHandler): StorageStore<State>
}

export interface TiedStoreCreator<
  AdapterConfig,
  Passed extends string | number | symbol = never,
  MergedCfg = AdapterConfig & MandatoryAdapterConfig,
  DefaultCfg = Pick<MergedCfg, keyof Omit<MergedCfg, Passed>> & Partial<MergedCfg>,
  Cfg extends DefaultCfg = DefaultCfg
> {
  <State>(defaultState: State, config: StoreCreatorConfig & Cfg): StorageStore<State>
}

/*
 * Tie public interface
 */

// prettier-ignore
export interface Tie<A = unknown, S = unknown, K extends string | number | symbol = never> {
  // single argument - store
  <State>(state: Store<State>)
    : IsUnknown<A> extends true
      ? Tie<A, State, K | 'store'>
      : RequiredKeys<Config<A, State>> extends K | 'store'
        ? StorageStore<State>
        : Tie<A, State, K | 'store'>

  // single argument - store creator
  (createStore: StoreCreator)
    : IsUnknown<A> extends false
      ? 'with' extends K
        ? TiedStoreCreator<A, K>
        : never
      : never

  // single argument - domain
  (domain: Domain)
    : IsUnknown<A> extends false
      ? 'with' extends K
        ? TiedStoreCreator<A, K>
        : never
      : never

  // single argument - config
  <C = Partial<Config<A, S> & A>>(config: C)
    : C extends Partial<Config<infer AdapterConfig, infer State>>
      ? IsUnknown<Collect<A, AdapterConfig>> extends true
        ? Tie<unknown, Collect<S, State>, K | keyof C>
        : IsUnknown<Collect<S, State>> extends true
          ? Tie<Collect<A, AdapterConfig>, unknown, K | keyof C>
          : RequiredKeys<Config<Collect<A, AdapterConfig>, Collect<S, State>>> extends K | keyof C
            ? StorageStore<Collect<S, State>>
            : Tie<Collect<A, AdapterConfig>, Collect<S, State>, K | keyof C>
      : never
}

/*
 * Tie implementation
 */

export const tie: Tie = ((
  arg: Store<any> | StoreCreator | Domain | Partial<Config<any>>
) =>
  (function curry(
    _config: Partial<Config<any>> = {},
    _adapter?: StorageAdapter<any>,
    _store?: Store<any>,
    _create?: StoreCreator
  ) {
    return (arg: any) => {
      let config = _config
      let adapter = _adapter
      let store = _store
      let create = _create

      // single argument - store creator
      if (typeof arg === 'function') {
        create = arg as StoreCreator
      }

      // single argument - store
      else if (is.store(arg)) {
        store = arg as Store<any>
      }

      // single argument - domain
      else if (is.domain(arg)) {
        create = arg.store
        config = Object.assign({}, config, { domain: arg })
      }

      // single argument - config
      else {
        if (arg.with) {
          adapter = arg.with as StorageAdapter<any>
        }
        if (arg.store /* && is.store(arg.store) */) {
          store = arg.store as Store<any>
        }
        config = Object.assign({}, config, arg)
      }

      if (create !== undefined) {
        if (adapter === undefined) {
          throw new Error('Storage adapter is not defined')
        }
        return wrapCreator(create, adapter, config as Config<any>)
      }

      return store === undefined || adapter === undefined || config.key === undefined
        ? curry(config, adapter, store, create)
        : wrapStore(store, config as Config<any>)
    }
  })()(arg)) as any

//
//
//

function wrapCreator<AdapterConfig>(
  createStore: StoreCreator,
  adapter: StorageAdapter<AdapterConfig>,
  cfg: Config<AdapterConfig>
): TiedStoreCreator<AdapterConfig> {
  return <State>(
    defaultState: State,
    config: StoreCreatorConfig & AdapterConfig
  ): StorageStore<State> => {
    const on = {
      error: (() => undefined) as ErrorHandler,
      update: cfg.using || (cfg.domain ? cfg.domain.event : createEvent)<State>(),
    }

    // initialize adapter
    const value = adapter(defaultState, Object.assign({}, cfg, config), on)

    // storage value
    const initial = value.get()

    // create effector store, with rehydrated value
    const store = createStore<State>(
      initial !== undefined ? initial : defaultState,
      config
    )

    // manually set `defaultState` to have .reset method working correct
    store.defaultState = defaultState

    // add update event listener
    store.on(on.update, (_, value) => value)

    // add error handler
    ;(store as any).catch = (handler: ErrorHandler) => {
      on.error = handler
      return store
    }

    // watch store changes, and save to storage
    store.watch(value.set)

    // return modified effector store
    return store as StorageStore<State>
  }
}

//
//
//

function wrapStore<AdapterConfig, State>(
  store: Store<State>,
  cfg: Config<AdapterConfig, State> & AdapterConfig
): StorageStore<State> {
  const on = {
    error: (() => undefined) as ErrorHandler,
    update: cfg.using || (cfg.domain ? cfg.domain.event : createEvent)<State>(),
  }

  // current store value
  const current = store.getState()

  // initialize adapter
  const value = cfg.with(current, cfg, on)

  // add update event listener
  store.on(on.update, (_, value) => value)

  // update storage value
  const initial = value.get()
  if (initial !== undefined && initial !== current) {
    on.update(initial) // push restored value to store
  }

  // add error handler
  ;(store as any).catch = (handler: ErrorHandler) => {
    on.error = handler
    return store
  }

  // watch store changes, and save to storage
  store.watch(value.set)

  // return modified effector store
  return store as StorageStore<State>
}
