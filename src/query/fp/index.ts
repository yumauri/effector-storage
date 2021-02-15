import type { Unit, Store } from 'effector'
import type { Done, Fail, Finally } from '../..'
import type { ChangeMethod, StateBehavior } from '../adapter'
import {
  persist as parent,
  pushState,
  replaceState,
  locationAssign,
  locationReplace,
} from '..'

export interface Config<State, Err = Error> {
  done?: Unit<Done<State>>
  fail?: Unit<Fail<Err>>
  finally?: Unit<Finally<State, Err>>
  pickup?: Unit<any>
  key?: string
  method?: ChangeMethod
  state?: StateBehavior
}

/**
 * Partially applied `persist` with predefined `query` adapter and curried `store`
 */
// FIXME: how to infer state backwards?
export function persist<Err = Error>(config: Config<any, Err> = {}) {
  return <State>(store: Store<State>): Store<State> => {
    parent(Object.assign({ store }, config))
    return store
  }
}

export { pushState, replaceState, locationAssign, locationReplace }
