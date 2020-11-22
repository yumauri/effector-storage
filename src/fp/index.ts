import type { Unit, Store } from 'effector'
import type { StorageAdapter, Done, Fail, Finally } from '..'
import { persist as parent } from '..'

type Config<State, Err = Error> = {
  adapter: StorageAdapter
  done?: Unit<Done<State>>
  fail?: Unit<Fail<Err>>
  finally?: Unit<Finally<State, Err>>
  pickup?: Unit<any>
  key?: string
}

/**
 * `persist` with curried `store`
 */
// FIXME: how to infer state backwards?
export function persist<Err = Error>(config: Config<any, Err>) {
  return <State>(store: Store<State>): Store<State> => {
    parent(Object.assign({ store }, config))
    return store
  }
}
