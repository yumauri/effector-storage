import type { Unit, Store } from 'effector'
import type { Exception } from '../..'
import { persist as parent } from '..'
export { sessionStorage } from '..'

export type Config<Fail = Error> = {
  readonly fail?: Unit<Exception<Fail>>
  readonly key?: string
}

/**
 * Partially applied `persist` with predefined `sessionStorage` adapter and curried `store`
 */
export function persist<Fail = Error>(config: Config<Fail> = {}) {
  return <State>(store: Store<State>): Store<State> => {
    parent(Object.assign({ store }, config))
    return store
  }
}
