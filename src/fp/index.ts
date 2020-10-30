import type { Unit, Store } from 'effector'
import type { StorageAdapter, Exception } from '..'
import { persist as parent } from '..'

type Config<Fail = Error> = {
  readonly with: StorageAdapter
  readonly fail?: Unit<Exception<Fail>>
  readonly key?: string
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
