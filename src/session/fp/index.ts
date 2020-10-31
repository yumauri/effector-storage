import type { Unit, Store } from 'effector'
import type { Exception } from '../..'
import { persist as parent } from '..'

export type Config<Fail = Error> = {
  fail?: Unit<Exception<Fail>>
  key?: string
  sync?: boolean
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
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
