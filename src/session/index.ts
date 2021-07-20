import type { Event, Effect, Store, Unit, Subscription } from 'effector'
import type { Done, Fail, Finally } from '..'
import { persist as parent } from '..'
import { nil } from '../nil'
import { storage } from '../storage'

export interface ConfigStore<State, Err = Error> {
  clock?: Unit<any>
  store: Store<State>
  done?: Unit<Done<State>>
  fail?: Unit<Fail<Err>>
  finally?: Unit<Finally<State, Err>>
  pickup?: Unit<any>
  key?: string
  sync?: boolean
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
}

export interface ConfigSourceTarget<State, Err = Error> {
  clock?: Unit<any>
  source: Store<State> | Event<State> | Effect<State, any, any>
  target: Store<State> | Event<State> | Effect<State, any, any>
  done?: Unit<Done<State>>
  fail?: Unit<Fail<Err>>
  finally?: Unit<Finally<State, Err>>
  pickup?: Unit<any>
  key?: string
  sync?: boolean
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
}

/**
 * Partially applied `persist` with predefined `sessionStorage` adapter
 */
export function persist<State, Err = Error>(
  config: ConfigStore<State, Err>
): Subscription
export function persist<State, Err = Error>(
  config: ConfigSourceTarget<State, Err>
): Subscription
export function persist<State, Err = Error>(config: any): Subscription {
  const adapter =
    typeof sessionStorage !== 'undefined'
      ? storage(Object.assign({ storage: sessionStorage }, config))
      : nil
  return parent<State, Err>(Object.assign({ adapter }, config))
}
