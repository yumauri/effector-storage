import type { Event, Effect, Store, Unit, Subscription } from 'effector'
import type { Done, Failure, Finally } from '..'
import { persist as parent } from '..'
import { nil } from '../nil'
import { storage } from '../storage'

export type ConfigStore<State, Fail = Error> = {
  store: Store<State>
  done?: Unit<Done<State>>
  fail?: Unit<Failure<Fail>>
  finally?: Unit<Finally<State, Fail>>
  pickup?: Unit<any>
  key?: string
  sync?: boolean
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
}

export type ConfigSourceTarget<State, Fail = Error> = {
  source: Store<State> | Event<State> | Effect<State, any, any>
  target: Store<State> | Event<State> | Effect<State, any, any>
  done?: Unit<Done<State>>
  fail?: Unit<Failure<Fail>>
  finally?: Unit<Finally<State, Fail>>
  pickup?: Unit<any>
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
  done,
  fail,
  finally: anyway,
  pickup,
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
    done,
    fail,
    finally: anyway,
    pickup,
    key,
  } as any)
}
