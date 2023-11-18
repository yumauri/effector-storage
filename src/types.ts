import type { Event, Effect, Store, Unit, Subscription } from 'effector'

export interface StorageAdapter {
  <State>(
    key: string,
    update: (raw?: any) => void
  ): {
    get(raw?: any, ctx?: any): State | Promise<State | undefined> | undefined
    set(value: State, ctx?: any): void
  }
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
  operation: 'set' | 'get'
  error: Err
  value?: any
}

export type Finally<State, Err> =
  | (Done<State> & { status: 'done' })
  | (Fail<Err> & { status: 'fail' })

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
