import type { Unit, Store } from 'effector'
import type { Done, Failure, Finally } from '../..'
import { persist as parent } from '..'

export type Config<State, Fail = Error> = {
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
 * Partially applied `persist` with predefined `localStorage` adapter and curried `store`
 */
// FIXME: how to infer state backwards?
export function persist<Fail = Error>(config: Config<any, Fail> = {}) {
  return <State>(store: Store<State>): Store<State> => {
    parent(Object.assign({ store }, config))
    return store
  }
}
