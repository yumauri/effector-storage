const has = (object: any, key: string) =>
  Object.prototype.hasOwnProperty.call(object, key)

interface EventListener {
  (event: any): void
}

interface Events {
  dispatchEvent(name: string, event: any): Promise<any>
  addEventListener(name: string, listener: EventListener): void
}

export function createEventsMock(): Events {
  const listeners: {
    [key: string]: EventListener[]
  } = Object.create(null)

  return {
    async dispatchEvent(name: string, event: any) {
      if (has(listeners, name) && listeners[name].length > 0) {
        return Promise.all(
          listeners[name].map(
            (listener) =>
              new Promise((resolve) => setTimeout(() => resolve(listener(event)), 0))
          )
        )
      }
    },

    addEventListener(name: string, listener: EventListener) {
      if (!has(listeners, name)) listeners[name] = []
      listeners[name].push(listener)
    },
  }
}
