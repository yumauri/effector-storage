import { Event } from 'effector'
import { ErrorHandler, StorageAdapter, StorageAdapterConfig } from '..'

export const storage = (
  storage: Storage,
  sync: boolean
): StorageAdapter<StorageAdapterConfig> => <State>(
  defaultValue: State,
  config: StorageAdapterConfig,
  on: {
    error: ErrorHandler
    update: Event<State | undefined>
  }
) => {
  const key = config.key

  // value getter
  const get = (value: State, raw?: string | null) => {
    try {
      const item = raw !== undefined ? raw : storage.getItem(key)
      return item === null ? value : JSON.parse(item)
    } catch (error) {
      on.error(error)
    }
    return value
  }

  // value setter
  const set = (value: State) => {
    try {
      storage.setItem(key, JSON.stringify(value))
    } catch (error) {
      on.error(error)
    }
  }

  if (sync) {
    addEventListener('storage', (e) => {
      if (e.storageArea === storage) {
        if (e.key === key) on.update(get(null as any, e.newValue))

        // `key` attribute is `null` when the change is caused by the storage `clear()` method
        if (e.key === null) on.update(null as any)
      }
    })
  }

  return {
    get: () => get(defaultValue),
    set,
  }
}
