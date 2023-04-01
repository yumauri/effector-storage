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
import EncryptedStorage from 'react-native-encrypted-storage'

export type { Done, Fail, Finally, StorageAdapter } from '../../types'

export interface ConfigPersist extends BaseConfigPersist {}

export interface EncryptedStorageConfig {
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
}

export interface ConfigStore<State, Err = Error>
  extends EncryptedStorageConfig,
    ConfigCommon<State, Err>,
    ConfigJustStore<State> {}

export interface ConfigSourceTarget<State, Err = Error>
  extends EncryptedStorageConfig,
    ConfigCommon<State, Err>,
    ConfigJustSourceTarget<State> {}

export interface Persist {
  <State, Err = Error>(config: ConfigSourceTarget<State, Err>): Subscription
  <State, Err = Error>(config: ConfigStore<State, Err>): Subscription
}

/**
 * Creates `EncryptedStorage` adapter
 */
export function encrypted(config?: EncryptedStorageConfig): StorageAdapter {
  return asyncStorage({
    storage: () => EncryptedStorage,
    ...config,
  })
}

/**
 * Creates custom partially applied `persist`
 * with predefined `EncryptedStorage` adapter
 */
export function createPersist(defaults?: ConfigPersist): Persist {
  return (config) =>
    base({
      adapter: encrypted({ ...defaults, ...config }),
      ...defaults,
      ...config,
    })
}

/**
 * Default partially applied `persist`
 */
export const persist = createPersist()
