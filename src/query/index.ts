import type { Subscription } from 'effector'
import type {
  ConfigPersist as BaseConfigPersist,
  ConfigCommon,
  ConfigJustStore,
  ConfigJustSourceTarget,
  StorageAdapter,
} from '../types'
import type { ChangeMethod, StateBehavior, QueryConfig } from './adapter'
import { persist as base } from '../core'
import { nil } from '../nil'
import { query as adapter } from './adapter'

export type { Done, Fail, Finally, StorageAdapter } from '../types'
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
}

export interface AdapterConfig {
  method?: ChangeMethod
  state?: StateBehavior
  def?: any
}

export interface ConfigStore<State, Err = Error>
  extends AdapterConfig,
    ConfigCommon<State, Err>,
    ConfigJustStore<State> {}

export interface ConfigSourceTarget<State, Err = Error>
  extends AdapterConfig,
    ConfigCommon<State, Err>,
    ConfigJustSourceTarget<State> {}

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
  return supports() ? adapter({ ...config }) : nil('query')
}

/**
 * Creates custom partially applied `persist`
 * with predefined `query` adapter
 */
export function createPersist(defaults?: ConfigPersist): Persist {
  return (config) => {
    const def =
      config.def !== undefined
        ? config.def
        : 'store' in config
        ? config.store.defaultState
        : null

    return base({
      adapter: query({ ...defaults, ...config, def }),
      ...defaults,
      ...config,
    })
  }
}

/**
 * Default partially applied `persist`
 */
export const persist = createPersist()
