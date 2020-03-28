function withStorage(createStore, storage) {
  storage = storage || localStorage

  return function(defaultState, config) {
    var errorHandler

    var get = value => {
      try {
        var item = storage.getItem(config.key)
        return item === null ? value : JSON.parse(item)
      } catch (error) {
        errorHandler && errorHandler(error)
      }

      return value
    }

    var set = value => {
      try {
        storage.setItem(config.key, JSON.stringify(value))
      } catch (error) {
        errorHandler && errorHandler(error)
      }
    }

    var store = createStore(get(defaultState), config)

    store.defaultState = defaultState
    store.get = get

    store.catch = handler => {
      errorHandler = handler
      return store
    }

    store.watch(set)

    return store
  }
}

module.exports = { withStorage }
