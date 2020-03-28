const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key)

module.exports = function() {
  const storage = Object.create(null)

  const noop = () => {}
  let getCallback = noop
  let setCallback = noop
  let removeCallback = noop
  let clearCallback = noop

  Object.defineProperty(storage, 'setItem', {
    value(key, value) {
      setCallback(key, value)
      key = String(key)
      value = String(value)
      storage[key] = value
    },
  })

  Object.defineProperty(storage, 'getItem', {
    value(key) {
      getCallback(key)
      key = String(key)
      return has(storage, key) ? storage[key] : null
    },
  })

  Object.defineProperty(storage, 'removeItem', {
    value(key) {
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
    value(n) {
      const key = Object.keys(storage)[n]
      return key === undefined ? null : key
    },
  })

  Object.defineProperty(storage, '_callbacks', {
    value(get, set, remove, clear) {
      getCallback = get === null ? noop : get
      setCallback = set === null ? noop : set
      removeCallback = remove === null ? noop : remove
      clearCallback = clear === null ? noop : clear
    },
  })

  return storage
}
