import type { Event, Effect, Store, Unit, Subscription } from 'effector'

export interface StorageAdapter {
  <State>(key: string, update: (raw?: any) => any): {
    get(raw?: any, ctx?: any): State | Promise<State>
    set(value: State, ctx?: any): void
  }
  keyArea?: any
  noop?: boolean
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
}

export interface ConfigAdapter {
  adapter: StorageAdapter
}

export interface ConfigCommon<State, Err = Error> {
  clock?: Unit<any>
  done?: Unit<Done<State>>
  fail?: Unit<Fail<Err>>
  finally?: Unit<Finally<State, Err>>
  pickup?: Unit<any>
  context?: Unit<any>
  key?: string
  keyPrefix?: string
}

export interface ConfigJustStore<State> {
  store: Store<State>
}

export interface ConfigJustSourceTarget<State> {
  source: Store<State> | Event<State> | Effect<State, any, any>
  target: Store<State> | Event<State> | Effect<State, any, any>
}

export interface ConfigStore<State, Err = Error>
  extends ConfigAdapter,
    ConfigCommon<State, Err>,
    ConfigJustStore<State> {}

export interface ConfigSourceTarget<State, Err = Error>
  extends ConfigAdapter,
    ConfigCommon<State, Err>,
    ConfigJustSourceTarget<State> {}

export interface Persist {
  <State, Err = Error>(config: ConfigSourceTarget<State, Err>): Subscription
  <State, Err = Error>(config: ConfigStore<State, Err>): Subscription
}
