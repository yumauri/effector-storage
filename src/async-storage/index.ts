import type { StorageAdapter, StorageAdapterFactory } from '../types'

export interface AsyncStorage {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
}

export interface AsyncStorageConfig {
  storage: () => AsyncStorage
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
}

/**
 * Creates generic `AsyncStorage` adapter
 */
export const asyncStorage: StorageAdapterFactory<AsyncStorageConfig> = ({
  storage,
  serialize = JSON.stringify,
  deserialize = JSON.parse,
}) => {
  const adapter: StorageAdapter = <State>(key: string) => ({
    async get() {
      const item = await storage().getItem(key)
      return item === null ? undefined : deserialize(item)
    },

    async set(value: State) {
      await storage().setItem(key, serialize(value))
    },
  })

  try {
    adapter.keyArea = storage()
  } catch (_error) {
    // do nothing
  }

  return adapter
}

// mark as factory
asyncStorage.factory = true
