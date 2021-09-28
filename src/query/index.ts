import type { Subscription } from 'effector'
import type {
  ConfigPersist as BaseConfigPersist,
  ConfigCommon,
  ConfigJustStore,
  ConfigJustSourceTarget,
} from '../types'
import type { ChangeMethod, StateBehavior } from './adapter'
import { persist as base } from '../persist'
import { nil } from '../nil'
import { query } from './adapter'

export type { Done, Fail, Finally, StorageAdapter } from '../types'
export {
  pushState,
  replaceState,
  locationAssign,
  locationReplace,
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
 * Creates custom partially applied `persist`
 * with predefined `query` adapter
 */
export function create(defaults?: ConfigPersist): Persist {
  return (config) => {
    const def =
      config.def !== undefined
        ? config.def
        : 'store' in config
        ? config.store.defaultState
        : null

    return base({
      adapter:
        typeof history !== 'undefined' && typeof location !== 'undefined'
          ? query({ ...defaults, ...config }, def)
          : nil('query'),
      ...defaults,
      ...config,
    })
  }
}

/**
 * Default partially applied `persist`
 */
export const persist = create()
