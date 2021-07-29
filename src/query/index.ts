import type { Event, Effect, Store, Unit, Subscription } from 'effector'
import type { Done, Fail, Finally } from '..'
import type { ChangeMethod, StateBehavior } from './adapter'
import { persist as parent } from '..'
import { nil } from '../nil'
import {
  pushState,
  replaceState,
  locationAssign,
  locationReplace,
  query,
} from './adapter'

export interface ConfigStore<State, Err = Error> {
  clock?: Unit<any>
  store: Store<State>
  done?: Unit<Done<State>>
  fail?: Unit<Fail<Err>>
  finally?: Unit<Finally<State, Err>>
  pickup?: Unit<any>
  key?: string
  method?: ChangeMethod
  state?: StateBehavior
  def?: any
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
  method?: ChangeMethod
  state?: StateBehavior
  def?: any
}

/**
 * Partially applied `persist` with predefined `query` adapter
 */
export function persist<State, Err = Error>(
  config: ConfigStore<State, Err>
): Subscription
export function persist<State, Err = Error>(
  config: ConfigSourceTarget<State, Err>
): Subscription
export function persist<State, Err = Error>(config: any): Subscription {
  const def =
    config.def !== undefined
      ? config.def
      : config.store
      ? config.store.defaultState
      : null
  const adapter =
    typeof history !== 'undefined' && typeof location !== 'undefined'
      ? query(config, def)
      : nil('query')
  return parent<State, Err>(Object.assign({ adapter }, config))
}

export { pushState, replaceState, locationAssign, locationReplace }
