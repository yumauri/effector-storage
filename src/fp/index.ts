import type { Unit, Store } from 'effector'
import type { StorageAdapter, Exception } from '..'
import { persist as parent } from '..'

type Config<Fail = Error> = {
  adapter: StorageAdapter
  fail?: Unit<Exception<Fail>>
  key?: string
}

/**
 * `persist` with curried `store`
 */
export function persist<Fail = Error>(config: Config<Fail>) {
  return <State>(store: Store<State>): Store<State> => {
    parent(Object.assign({ store }, config))
    return store
  }
}
