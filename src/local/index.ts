import type { Event, Effect, Store, Unit, Subscription } from 'effector'
import type { Done, Fail, Finally } from '..'
import { persist as parent } from '..'
import { nil } from '../nil'
import { storage } from '../storage'

export type ConfigStore<State, Err = Error> = {
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

export type ConfigSourceTarget<State, Err = Error> = {
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
 * Partially applied `persist` with predefined `localStorage` adapter
 */
export function persist<State, Err = Error>(
  config: ConfigStore<State, Err>
): Subscription
export function persist<State, Err = Error>(
  config: ConfigSourceTarget<State, Err>
): Subscription
export function persist<State, Err = Error>(config: any): Subscription {
  const adapter =
    typeof localStorage !== 'undefined'
      ? storage(Object.assign({ storage: localStorage }, config))
      : nil
  return parent<State, Err>(Object.assign({ adapter }, config))
}
