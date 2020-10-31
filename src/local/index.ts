import type { Event, Effect, Store, Unit, Subscription } from 'effector'
import type { Exception } from '..'
import { persist as parent } from '..'
import { nil } from '../nil'
import { storage } from '../storage'

export type ConfigStore<State, Fail = Error> = {
  store: Store<State>
  fail?: Unit<Exception<Fail>>
  key?: string
  sync?: boolean
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
}

export type ConfigSourceTarget<State, Fail = Error> = {
  source: Store<State> | Event<State> | Effect<State, any, any>
  target: Store<State> | Event<State> | Effect<State, any, any>
  fail?: Unit<Exception<Fail>>
  key?: string
  sync?: boolean
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
}

/**
 * Partially applied `persist` with predefined `localStorage` adapter
 */
export function persist<State, Fail = Error>(
  config: ConfigStore<State, Fail>
): Subscription
export function persist<State, Fail = Error>(
  config: ConfigSourceTarget<State, Fail>
): Subscription
export function persist<State, Fail = Error>({
  store,
  source,
  target,
  fail,
  key,
  sync = true,
  serialize,
  deserialize,
}: Partial<
  ConfigStore<State, Fail> & ConfigSourceTarget<State, Fail>
>): Subscription {
  return parent<State, Fail>({
    adapter:
      typeof localStorage !== 'undefined'
        ? storage({ storage: localStorage, sync, serialize, deserialize })
        : nil,
    store,
    source,
    target,
    fail,
    key,
  } as any)
}
