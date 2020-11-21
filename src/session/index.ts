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
 * Partially applied `persist` with predefined `sessionStorage` adapter
 */
export function persist<State, Err = Error>(
  config: ConfigStore<State, Err>
): Subscription
export function persist<State, Err = Error>(
  config: ConfigSourceTarget<State, Err>
): Subscription
export function persist<State, Err = Error>({
  store,
  source,
  target,
  done,
  fail,
  finally: anyway,
  pickup,
  key,
  sync = false,
  serialize,
  deserialize,
}: Partial<
  ConfigStore<State, Err> & ConfigSourceTarget<State, Err>
>): Subscription {
  return parent<State, Err>({
    adapter:
      typeof sessionStorage !== 'undefined'
        ? storage({ storage: sessionStorage, sync, serialize, deserialize })
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
