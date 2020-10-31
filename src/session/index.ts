import type { Event, Effect, Store, Unit, Subscription } from 'effector'
import type { Exception } from '..'
import { persist as parent } from '..'
import { nil } from '../nil'
import { storage } from '../storage'

export type ConfigStore<State, Fail = Error> = {
  store: Store<State>
  fail?: Unit<Exception<Fail>>
  key?: string
}

export type ConfigSourceTarget<State, Fail = Error> = {
  source: Store<State> | Event<State> | Effect<State, any, any>
  target: Store<State> | Event<State> | Effect<State, any, any>
  fail?: Unit<Exception<Fail>>
  key?: string
}

/**
 * `sessionStorage` adapter
 */
const adapter = typeof sessionStorage !== 'undefined' ? storage({ storage: sessionStorage }) : nil
export { adapter as sessionStorage }

/**
 * Partially applied `persist` with predefined `sessionStorage` adapter
 */
export function persist<State, Fail = Error>(config: ConfigStore<State, Fail>): Subscription
export function persist<State, Fail = Error>(config: ConfigSourceTarget<State, Fail>): Subscription
export function persist(config: any): Subscription {
  return parent(Object.assign({ with: adapter }, config))
}
