import type { Event, Effect, Store, Unit, Subscription } from 'effector'
import type { Exception } from '..'
import { tie } from '..'
import { storage } from '../storage'

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
 * `sessionStorage` adapter
 */
export const sessionStorage = storage(window.sessionStorage, false)

/**
 * Partially applied `tie` with predefined `sessionStorage` adapter
 */
export function persist<State, Fail = Error>(config: ConfigStore<State, Fail>): Subscription
export function persist<State, Fail = Error>(config: ConfigSourceTarget<State, Fail>): Subscription
export function persist(config: any): Subscription {
  return tie(Object.assign({ with: sessionStorage }, config))
}
