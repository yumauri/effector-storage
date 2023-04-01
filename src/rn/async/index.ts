import type { Subscription } from 'effector'
import type {
  ConfigPersist as BaseConfigPersist,
  ConfigCommon,
  ConfigJustStore,
  ConfigJustSourceTarget,
  StorageAdapter,
} from '../../types'
import { persist as base } from '../../core'
import { asyncStorage } from '../../async-storage'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type { Done, Fail, Finally, StorageAdapter } from '../../types'

export interface ConfigPersist extends BaseConfigPersist {}

export interface AsyncStorageConfig {
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
}

export interface ConfigStore<State, Err = Error>
  extends AsyncStorageConfig,
    ConfigCommon<State, Err>,
    ConfigJustStore<State> {}

export interface ConfigSourceTarget<State, Err = Error>
  extends AsyncStorageConfig,
    ConfigCommon<State, Err>,
    ConfigJustSourceTarget<State> {}

export interface Persist {
  <State, Err = Error>(config: ConfigSourceTarget<State, Err>): Subscription
  <State, Err = Error>(config: ConfigStore<State, Err>): Subscription
}

/**
 * Creates `AsyncStorage` adapter
 */
export function async(config?: AsyncStorageConfig): StorageAdapter {
  return asyncStorage({
    storage: () => AsyncStorage,
    ...config,
  })
}

/**
 * Creates custom partially applied `persist`
 * with predefined `AsyncStorage` adapter
 */
export function createPersist(defaults?: ConfigPersist): Persist {
  return (config) =>
    base({
      adapter: async({ ...defaults, ...config }),
      ...defaults,
      ...config,
    })
}

/**
 * Default partially applied `persist`
 */
export const persist = createPersist()
