import type { StorageAdapter } from '../types'

export interface StorageConfig {
  storage: () => Storage
  sync?: boolean | 'force'
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
  timeout?: number
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
  timeout,
  def,
}: StorageConfig): StorageAdapter {
  const adapter: StorageAdapter = <State>(
    key: string,
    update: (raw?: any) => void
  ) => {
    let scheduled: ReturnType<typeof setTimeout> | undefined
    let unsaved: State
    let to: Storage

    // flush unsaved changes to Storage
    const flush = () => to.setItem(key, serialize(unsaved))

    // postponed flush unsaved changes to Storage
    const postponed = (e?: BeforeUnloadEvent | 1) => {
      scheduled = clearTimeout(scheduled) as undefined
      if (e) flush()

      // according to documentation, it is recommended to remove 'beforeunload' listener
      // as soon as possible to minimize the effect on performance
      // https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event
      if (typeof removeEventListener !== 'undefined') {
        removeEventListener('beforeunload', postponed)
      }
    }

    // schedule postponed flush unsaved changes to Storage
    const schedule = () => {
      scheduled = setTimeout(postponed, timeout, 1)

      // according to documentation, it is recommended to add 'beforeunload' listener
      // ONLY when it is necessary, when there are actually unsaved changes
      // https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event
      if (typeof addEventListener !== 'undefined') {
        addEventListener('beforeunload', postponed)
      }
    }

    if (sync && typeof addEventListener !== 'undefined') {
      addEventListener('storage', (e) => {
        // I hope storage is accessible in case 'storage' event is happening
        // so calling `storage()` should not throw security exception here
        if (e.storageArea === storage()) {
          // call `get` function with new value or undefined in case of force update
          if (e.key === key) update(sync === 'force' ? undefined : e.newValue)

          // `key` attribute is `null` when the change is caused by the storage `clear()` method
          if (e.key === null) update(null)
        }
      })
    }

    return {
      get(raw?: string | null) {
        postponed() // cancel postponed flush
        const item = raw !== undefined ? raw : storage().getItem(key)
        return item === null
          ? def !== undefined
            ? def
            : raw // 'undefined' when pickup, 'null' when clear
          : deserialize(item)
      },

      set(value: State) {
        unsaved = value
        to = storage()
        if (timeout === undefined) {
          flush()
        } else if (!scheduled) {
          schedule()
        }
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
