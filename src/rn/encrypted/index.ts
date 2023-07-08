import type { Subscription } from 'effector'
import type {
  ConfigPersist as BaseConfigPersist,
  ConfigStore as BaseConfigStore,
  ConfigSourceTarget as BaseConfigSourceTarget,
  StorageAdapter,
} from '../../types'
import { persist as base } from '../../core'
import { asyncStorage } from '../../async-storage'
import EncryptedStorage from 'react-native-encrypted-storage'

export type {
  Contract,
  Done,
  Fail,
  Finally,
  StorageAdapter,
  StorageAdapterFactory,
} from '../../types'

export interface ConfigPersist extends BaseConfigPersist {}

export interface EncryptedStorageConfig {
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
}

export interface ConfigStore<State, Err = Error>
  extends EncryptedStorageConfig,
    BaseConfigStore<State, Err> {}

export interface ConfigSourceTarget<State, Err = Error>
  extends EncryptedStorageConfig,
    BaseConfigSourceTarget<State, Err> {}

export interface Persist {
  <State, Err = Error>(config: ConfigSourceTarget<State, Err>): Subscription
  <State, Err = Error>(config: ConfigStore<State, Err>): Subscription
}

/**
 * Creates `EncryptedStorage` adapter
 *
 * @deprecated use @effector-storage/react-native-encrypted-storage instead
 */
encrypted.factory = true as const
export function encrypted(config?: EncryptedStorageConfig): StorageAdapter {
  return asyncStorage({
    storage: () => EncryptedStorage,
    ...config,
  })
}

/**
 * Creates custom partially applied `persist`
 * with predefined `EncryptedStorage` adapter
 *
 * @deprecated use @effector-storage/react-native-encrypted-storage instead
 */
export function createPersist(defaults?: ConfigPersist): Persist {
  return (config) =>
    base({
      adapter: encrypted,
      ...defaults,
      ...config,
    })
}

/**
 * Default partially applied `persist`
 *
 * @deprecated use @effector-storage/react-native-encrypted-storage instead
 */
export const persist = createPersist()
