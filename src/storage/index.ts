import type { StorageAdapter } from '../types'

export interface StorageConfig {
  storage: () => Storage
  sync?: boolean | 'force'
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
  def?: any
}

/**
 * Creates generic `Storage` adapter
 */
storage.factory = true as const
export function storage({
  storage,
  sync = false,
  serialize = JSON.stringify,
  deserialize = JSON.parse,
  def,
}: StorageConfig): StorageAdapter {
  const adapter: StorageAdapter = <State>(
    key: string,
    update: (raw?: any) => any
  ) => {
    if (sync && typeof addEventListener !== 'undefined') {
      addEventListener('storage', (e) => {
        // I hope storage is accessible in case 'storage' event is happening
        // so calling `storage()` should not throw security exception here
        if (e.storageArea === storage()) {
          // call `get` function with new value
          if (e.key === key) update(sync === 'force' ? undefined : e.newValue)

          // `key` attribute is `null` when the change is caused by the storage `clear()` method
          if (e.key === null) update(null)
        }
      })
    }

    return {
      get(raw?: string | null) {
        const item = raw !== undefined ? raw : storage().getItem(key)
        return item === null
          ? def !== undefined
            ? def
            : raw // 'undefined' when pickup, 'null' when clear
          : deserialize(item)
      },

      set(value: State) {
        storage().setItem(key, serialize(value))
      },
    }
  }

  try {
    adapter.keyArea = storage()
  } catch (error) {
    // do nothing
  }

  return adapter
}
