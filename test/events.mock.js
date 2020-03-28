const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key)

module.exports = function() {
  const listeners = Object.create(null)

  return {
    async dispatchEvent(event, ...args) {
      if (has(listeners, event) && listeners[event].length > 0) {
        return Promise.all(
          listeners[event].map(
            listener =>
              new Promise(resolve =>
                setTimeout(() => resolve(listener(...args)), 0)
              )
          )
        )
      }
    },

    addEventListener(event, listener) {
      if (!has(listeners, event)) listeners[event] = []
      listeners[event].push(listener)
    },
  }
}
