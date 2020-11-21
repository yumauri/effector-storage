import type { Unit, Store } from 'effector'
import type { Done, Fail, Finally } from '../..'
import { persist as parent } from '..'

export type Config<State, Err = Error> = {
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
 * Partially applied `persist` with predefined `sessionStorage` adapter and curried `store`
 */
// FIXME: how to infer state backwards?
export function persist<Err = Error>(config: Config<any, Err> = {}) {
  return <State>(store: Store<State>): Store<State> => {
    parent(Object.assign({ store }, config))
    return store
  }
}
