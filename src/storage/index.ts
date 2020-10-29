import type { StorageAdapter } from '..'

/**
 * Generic `Storage` adapter factory
 */
export function storage(storage: Storage, sync: boolean): StorageAdapter {
  return <State>(key: string, update: (raw?: any) => any) => {
    if (sync) {
      window.addEventListener('storage', (e) => {
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
        return value === undefined && item === null ? undefined : JSON.parse(item as any)
      },

      set(value: State) {
        storage.setItem(key, JSON.stringify(value))
      },
    }
  }
}
