import type { StorageAdapter } from '..'

export type StorageConfig = {
  storage: Storage
  sync?: boolean
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
}

const cache = new Map()
const cached = <K, T>(map: Map<K, T>, key: K, value?: T, pointer?: any): T =>
  map.get(key) ||
  (map.set(key, (pointer = value || (new Map() as any))), pointer)

/**
 * Generic `Storage` adapter factory
 */
export function storage({
  storage,
  sync = false,
  serialize = JSON.stringify,
  deserialize = JSON.parse,
}: StorageConfig): StorageAdapter {
  // prettier-ignore
  return cached(cached(cached(cached(cache, storage), serialize), deserialize), sync,
    <State>(key: string, update: (raw?: any) => any) => {
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
  )
}
