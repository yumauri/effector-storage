import type { Event, Effect, Store, Unit, Subscription } from 'effector'

export interface Adapter<State> {
  get( //
    this: void,
    raw?: any,
    ctx?: any
  ): State | undefined | Promise<State | undefined>
  set( //
    this: void,
    value: State,
    ctx?: any
  ): void | Promise<void>
  // remove?(ctx?: any): void | Promise<void>
}

export interface DisposableAdapter<State> extends Adapter<State> {
  (): void
}

export interface StorageAdapter {
  <State>(
    key: string,
    update: (raw?: any) => void
  ): Adapter<State> | DisposableAdapter<State>
  keyArea?: any
  noop?: boolean
}

export interface StorageAdapterFactory<AdapterConfig> {
  (config?: AdapterConfig): StorageAdapter
  factory: true
}

export type Contract<Data> =
  | ((raw: unknown) => raw is Data)
  | {
      isData: (raw: unknown) => raw is Data
      getErrorMessages: (raw: unknown) => string[]
    }

export type Done<State> = {
  key: string
  keyPrefix: string
  operation: 'set' | 'get'
  value: State
}

export type Fail<Err> = {
  key: string
  keyPrefix: string
  operation: 'set' | 'get' | 'validate'
  error: Err
  value?: any
}

export type FinallyDone<State> = Done<State> & { status: 'done' }
export type FinallyFail<Err> = Fail<Err> & { status: 'fail' }
export type Finally<State, Err> = FinallyDone<State> | FinallyFail<Err>

export interface ConfigPersist {
  pickup?: Unit<any>
  context?: Unit<any>
  keyPrefix?: string
  contract?: Contract<any>
}

export interface ConfigAdapter {
  adapter: StorageAdapter
}

export interface ConfigAdapterFactory<AdapterConfig> {
  adapter: StorageAdapterFactory<AdapterConfig>
}

interface ConfigCommon<State, Err = Error> {
  clock?: Unit<any>
  done?: Unit<Done<State>>
  fail?: Unit<Fail<Err>>
  finally?: Unit<Finally<State, Err>>
  pickup?: Unit<any>
  context?: Unit<any>
  key?: string
  keyPrefix?: string
  contract?: Contract<State | undefined>
}

interface ConfigJustStore<State> {
  store: Store<State>
}

interface ConfigJustSourceTarget<State> {
  source: Store<State> | Event<State> | Effect<State, any, any>
  target: Store<State> | Event<State> | Effect<State, any, any>
}

export interface ConfigStore<State, Err = Error>
  extends ConfigCommon<State, Err>,
    ConfigJustStore<State> {}

export interface ConfigSourceTarget<State, Err = Error>
  extends ConfigCommon<State, Err>,
    ConfigJustSourceTarget<State> {}

export interface Persist {
  <State, Err = Error>(
    config: ConfigAdapter & ConfigSourceTarget<State, Err>
  ): Subscription
  <State, Err = Error>(
    config: ConfigAdapter & ConfigStore<State, Err>
  ): Subscription
  <AdapterConfig, State, Err = Error>(
    config: ConfigAdapterFactory<AdapterConfig> &
      ConfigSourceTarget<State, Err> &
      AdapterConfig
  ): Subscription
  <AdapterConfig, State, Err = Error>(
    config: ConfigAdapterFactory<AdapterConfig> &
      ConfigStore<State, Err> &
      AdapterConfig
  ): Subscription
}

export interface StorageHandles<State, Err> {
  get: Effect<void, State, Fail<Err>>
  set: Effect<State, void, Fail<Err>>
  remove: Effect<void, void, Fail<Err>>
}

export interface ConfigCreateStorage<State> {
  context?: Unit<any>
  keyPrefix?: string
  contract?: Contract<State | undefined>
}

export interface CreateStorage {
  <State, AdapterConfig, Err = Error>(
    key: string,
    config: ConfigAdapterFactory<AdapterConfig> &
      ConfigCreateStorage<State> &
      AdapterConfig
  ): StorageHandles<State, Err>
  <State, AdapterConfig, Err = Error>(
    config: ConfigAdapterFactory<AdapterConfig> &
      ConfigCreateStorage<State> &
      AdapterConfig & { key: string }
  ): StorageHandles<State, Err>
  <State, Err = Error>(
    key: string,
    config: ConfigAdapter & ConfigCreateStorage<State>
  ): StorageHandles<State, Err>
  <State, Err = Error>(
    config: ConfigAdapter & ConfigCreateStorage<State> & { key: string }
  ): StorageHandles<State, Err>
}
