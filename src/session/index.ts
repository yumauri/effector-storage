import type { Subscription } from 'effector'
import type {
  ConfigPersist as BaseConfigPersist,
  ConfigCommon,
  ConfigJustStore,
  ConfigJustSourceTarget,
  StorageAdapter,
} from '../types'
import type { StorageConfig } from '../storage'
import { persist as base } from '../core'
import { nil } from '../nil'
import { storage } from '../storage'

export type { Done, Fail, Finally, StorageAdapter } from '../types'

export interface ConfigPersist extends BaseConfigPersist {
  sync?: boolean
}

export interface AdapterConfig {
  sync?: boolean
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
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

export interface SessionStorageConfig extends Omit<StorageConfig, 'storage'> {}

/**
 * Function, checking if `sessionStorage` exists
 */
function supports() {
  try {
    return typeof sessionStorage !== 'undefined'
  } catch (error) {
    // accessing `sessionStorage` could throw an exception only in one case -
    // when `sessionStorage` IS supported, but blocked by security policies
    return true
  }
}

/**
 * Creates `sessionStorage` adapter
 */
export function session(config?: SessionStorageConfig): StorageAdapter {
  return supports()
    ? storage({
        storage: () => sessionStorage,
        ...config,
      })
    : nil('session')
}

/**
 * Creates custom partially applied `persist`
 * with predefined `sessionStorage` adapter
 */
export function createPersist(defaults?: ConfigPersist): Persist {
  return (config) => {
    const def =
      config.def !== undefined
        ? config.def
        : 'store' in config
        ? config.store.defaultState
        : undefined

    return base({
      adapter: session({ ...defaults, ...config, def }),
      ...defaults,
      ...config,
    })
  }
}

/**
 * Default partially applied `persist`
 */
export const persist = createPersist()
