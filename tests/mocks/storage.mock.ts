const has = (object: any, key: string) =>
  Object.prototype.hasOwnProperty.call(object, key)

export function createStorageMock(): Storage {
  const storage = Object.create(null)

  const noop: any = () => undefined
  let getCallback: (key: string) => string | null = noop
  let setCallback: (key: string, value: string) => void = noop
  let removeCallback: (key: string) => void = noop
  let clearCallback: () => void = noop

  Object.defineProperty(storage, 'setItem', {
    value(key: string, value: string) {
      setCallback(key, value)
      key = String(key)
      value = String(value)
      storage[key] = value
    },
  })

  Object.defineProperty(storage, 'getItem', {
    value(key: string) {
      getCallback(key)
      key = String(key)
      return has(storage, key) ? storage[key] : null
    },
  })

  Object.defineProperty(storage, 'removeItem', {
    value(key: string) {
      removeCallback(key)
      key = String(key)
      if (has(storage, key)) {
        delete storage[key]
      }
    },
  })

  Object.defineProperty(storage, 'clear', {
    value() {
      clearCallback()
      for (const key in storage) {
        if (has(storage, key)) {
          delete storage[key]
        }
      }
    },
  })

  Object.defineProperty(storage, 'length', {
    get() {
      return Object.keys(storage).length
    },
  })

  Object.defineProperty(storage, 'key', {
    value(n: number) {
      const key = Object.keys(storage)[n]
      return key === undefined ? null : key
    },
  })

  Object.defineProperty(storage, '_callbacks', {
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

  return storage
}
