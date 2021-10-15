import type { AsyncStorage } from '../../src/async-storage'

const has = (object: any, key: string) =>
  Object.prototype.hasOwnProperty.call(object, key)

export function createAsyncStorageMock(): AsyncStorage {
  const asyncStorage = Object.create(null)

  const noop: any = () => undefined
  let getCallback: (key: string) => string | null = noop
  let setCallback: (key: string, value: string) => void = noop
  let removeCallback: (key: string) => void = noop
  let clearCallback: () => void = noop

  Object.defineProperty(asyncStorage, 'setItem', {
    async value(key: string, value: string) {
      await Promise.resolve()
      setCallback(key, value)
      key = String(key)
      value = String(value)
      asyncStorage[key] = value
    },
  })

  Object.defineProperty(asyncStorage, 'getItem', {
    async value(key: string) {
      await Promise.resolve()
      getCallback(key)
      key = String(key)
      return has(asyncStorage, key) ? asyncStorage[key] : null
    },
  })

  Object.defineProperty(asyncStorage, 'removeItem', {
    async value(key: string) {
      await Promise.resolve()
      removeCallback(key)
      key = String(key)
      if (has(asyncStorage, key)) {
        delete asyncStorage[key]
      }
    },
  })

  Object.defineProperty(asyncStorage, 'clear', {
    async value() {
      await Promise.resolve()
      clearCallback()
      for (const key in asyncStorage) {
        if (has(asyncStorage, key)) {
          delete asyncStorage[key]
        }
      }
    },
  })

  Object.defineProperty(asyncStorage, '_callbacks', {
    value(
      get: typeof getCallback | null,
      set: typeof setCallback | null,
      remove: typeof removeCallback | null,
      clear: typeof clearCallback | null
    ) {
      getCallback = get === null ? noop : get
      setCallback = set === null ? noop : set
      removeCallback = remove === null ? noop : remove
      clearCallback = clear === null ? noop : clear
    },
  })

  return asyncStorage
}
