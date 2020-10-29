import type { Event, Effect, Store, Unit, Subscription } from 'effector'
import type { Exception } from '..'
import { tie } from '..'
import { storage } from '../storage'
export { sink } from '..'

export type ConfigStore<State, Fail = Error> = {
  readonly store: Store<State>
  readonly fail?: Unit<Exception<Fail>>
  readonly key?: string
}

export type ConfigSourceTarget<State, Fail = Error> = {
  readonly source: Store<State> | Event<State> | Effect<State, any, any>
  readonly target: Store<State> | Event<State> | Effect<State, any, any>
  readonly fail?: Unit<Exception<Fail>>
  readonly key?: string
}

/**
 * `localStorage` adapter
 */
export const localStorage = storage(window.localStorage, true)

/**
 * Partially applied `tie` with predefined `localStorage` adapter
 */
export function persist<State, Fail = Error>(config: ConfigStore<State, Fail>): Subscription
export function persist<State, Fail = Error>(config: ConfigSourceTarget<State, Fail>): Subscription
export function persist(config: any): Subscription {
  return tie(Object.assign({ with: localStorage }, config))
}
