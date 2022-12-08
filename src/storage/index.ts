import type { StorageAdapter } from '../types'

export interface StorageConfig {
  storage: Storage
  sync?: boolean
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
  def?: any
}

/**
 * Creates generic `Storage` adapter
 */
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
        if (e.storageArea === storage) {
          // call `get` function with new value
          if (e.key === key) update(e.newValue)

          // `key` attribute is `null` when the change is caused by the storage `clear()` method
          if (e.key === null) update(null)
        }
      })
    }

    return {
      get(value?: string | null) {
        const item = value !== undefined ? value : storage.getItem(key)
        return item === null
          ? def !== undefined
            ? def
            : value // 'undefined' when pickup, 'null' when clear
          : deserialize(item)
      },

      set(value: State) {
        storage.setItem(key, serialize(value))
      },
    }
  }

  adapter.keyArea = storage
  return adapter
}
