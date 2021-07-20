import type { Event, Effect, Store, Unit, Subscription } from 'effector'
import type { Done, Fail, Finally } from '..'
import { persist as parent } from '..'
import { memory } from './adapter'

export interface ConfigStore<State, Err = Error> {
  clock?: Unit<any>
  store: Store<State>
  done?: Unit<Done<State>>
  fail?: Unit<Fail<Err>>
  finally?: Unit<Finally<State, Err>>
  pickup?: Unit<any>
  key?: string
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
}

/**
 * Partially applied `persist` with predefined `memory` adapter
 */
export function persist<State, Err = Error>(
  config: ConfigStore<State, Err>
): Subscription
export function persist<State, Err = Error>(
  config: ConfigSourceTarget<State, Err>
): Subscription
export function persist<State, Err = Error>(config: any): Subscription {
  return parent<State, Err>(Object.assign({ adapter: memory }, config))
}
