var { withStorage: withStorageBase } = require('..')

function withStorage(createStore, storage) {
  var createStorageStore = withStorageBase(createStore, storage)

  return function(defaultState, config) {
    var store = createStorageStore(defaultState, config)

    addEventListener('storage', event => {
      event.key === config.key && store.setState(store.get())
    })

    return store
  }
}

module.exports = { withStorage }
