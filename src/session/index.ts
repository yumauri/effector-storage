import type { Subscription } from 'effector'
import type {
  ConfigPersist as BaseConfigPersist,
  ConfigCommon,
  ConfigJustStore,
  ConfigJustSourceTarget,
  StorageAdapter,
} from '../types'
import type { StorageConfig } from '../storage'
import { persist as base } from '../persist'
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
 * Function, checking if `sessionStorage` exists and accessible
 */
function supports() {
  try {
    return typeof sessionStorage !== 'undefined'
  } catch (error) {
    return false // should somehow return error instance?
  }
}

/**
 * Creates `sessionStorage` adapter
 */
export function session(config?: SessionStorageConfig): StorageAdapter {
  return supports()
    ? storage({
        storage: sessionStorage,
        ...config,
      })
    : nil('session')
}

/**
 * Creates custom partially applied `persist`
 * with predefined `sessionStorage` adapter
 */
export function createPersist(defaults?: ConfigPersist): Persist {
  return (config) =>
    base({
      adapter: session({ ...defaults, ...config }),
      ...defaults,
      ...config,
    })
}

/**
 * Default partially applied `persist`
 */
export const persist = createPersist()
