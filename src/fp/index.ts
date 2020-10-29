import type { Unit, Store } from 'effector'
import type { StorageAdapter, Exception } from '..'
import { tie as general } from '..'
export { sink } from '..'

type Config<Fail = Error> = {
  readonly with: StorageAdapter
  readonly fail?: Unit<Exception<Fail>>
  readonly key?: string
}

/**
 * `tie` with curried `store`
 */
export function tie<Fail = Error>(config: Config<Fail>) {
  return <State>(store: Store<State>): Store<State> => {
    general(Object.assign({ store }, config))
    return store
  }
}
