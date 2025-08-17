import type { Subscription } from 'effector'
import type {
  ConfigPersist as BaseConfigPersist,
  ConfigStore as BaseConfigStore,
  ConfigSourceTarget as BaseConfigSourceTarget,
  StorageAdapter,
} from '../types'
import type { ChangeMethod, StateBehavior, QueryConfig } from './adapter'
import { persist as base } from '../core'
import { nil } from '../nil'
import { adapter } from './adapter'

export type {
  Contract,
  Done,
  Fail,
  Finally,
  Adapter,
  DisposableAdapter,
  StorageAdapter,
  StorageAdapterFactory,
} from '../types'
export type { ChangeMethod, StateBehavior, QueryConfig } from './adapter'
export {
  locationAssign,
  locationReplace,
  pushState,
  replaceState,
} from './adapter'

export interface ConfigPersist extends BaseConfigPersist {
  method?: ChangeMethod
  state?: StateBehavior
  timeout?: number
}

export interface ConfigStore<State, Err = Error>
  extends QueryConfig,
    BaseConfigStore<State, Err> {}

export interface ConfigSourceTarget<State, Err = Error>
  extends QueryConfig,
    BaseConfigSourceTarget<State, Err> {}

export interface Persist {
  <State, Err = Error>(config: ConfigSourceTarget<State, Err>): Subscription
  <State, Err = Error>(config: ConfigStore<State, Err>): Subscription
}

/**
 * Function, checking if `history` and `location` exists and accessible
 */
function supports() {
  return typeof history !== 'undefined' && typeof location !== 'undefined'
}

/**
 * Creates query string adapter
 */
export function query(config?: QueryConfig): StorageAdapter {
  return supports()
    ? adapter({
        ...config,
      })
    : nil({ keyArea: 'query' })
}

export namespace query {
  export const factory = true
}

/**
 * Creates custom partially applied `persist`
 * with predefined `query` adapter
 */
export function createPersist(defaults?: ConfigPersist): Persist {
  return (config) =>
    base({
      adapter: query,
      ...defaults,
      ...config,
    })
}

/**
 * Default partially applied `persist`
 */
export const persist: Persist = /*#__PURE__*/ createPersist()
