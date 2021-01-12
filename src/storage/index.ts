import type { StorageAdapter } from '..'

export interface StorageConfig {
  storage: Storage
  sync?: boolean // DEPRECATED
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
}

/**
 * Generic `Storage` adapter factory
 */
export function storage({
  storage,
  sync = false,
  serialize = JSON.stringify,
  deserialize = JSON.parse,
}: StorageConfig): StorageAdapter {
  const adapter: StorageAdapter = <State>(
    key: string,
    update: (raw?: any) => any
  ) => {
    if (sync && typeof addEventListener !== 'undefined') {
      addEventListener('storage', (e) => {
        if (e.storageArea === storage) {
          if (e.key === key) update(e.newValue)

          // `key` attribute is `null` when the change is caused by the storage `clear()` method
          if (e.key === null) update(null)
        }
      })
    }

    return {
      get(value?: string | null) {
        const item = value !== undefined ? value : storage.getItem(key)
        return value === undefined && item === null
          ? undefined
          : deserialize(item as any)
      },

      set(value: State) {
        storage.setItem(key, serialize(value))
      },
    }
  }

  adapter.keyArea = storage
  return adapter
}
