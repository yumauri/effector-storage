import type { Unit, Store } from 'effector'
import type { StorageAdapter, Done, Failure, Finally } from '..'
import { persist as parent } from '..'

type Config<State, Fail = Error> = {
  adapter: StorageAdapter
  done?: Unit<Done<State>>
  fail?: Unit<Failure<Fail>>
  finally?: Unit<Finally<State, Fail>>
  pickup?: Unit<any>
  key?: string
}

/**
 * `persist` with curried `store`
 */
// FIXME: how to infer state backwards?
export function persist<Fail = Error>(config: Config<any, Fail>) {
  return <State>(store: Store<State>): Store<State> => {
    parent(Object.assign({ store }, config))
    return store
  }
}
