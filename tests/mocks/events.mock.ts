export interface EventListener {
  (event: any): void
}

export interface Events {
  dispatchEvent(name: string, event: any): Promise<any>
  addEventListener(name: string, listener: EventListener): void
  removeEventListener(name: string, listener: EventListener): void
}

export class EventsMock implements Events {
  public listeners = new Map<string, EventListener[]>()

  public async dispatchEvent(
    name: string,
    event: any
  ): Promise<unknown[] | undefined> {
    const listeners = this.listeners.get(name)
    if (listeners && listeners.length > 0) {
      return Promise.all(
        listeners.map(
          (listener) =>
            new Promise((resolve) =>
              setTimeout(() => resolve(listener(event)), 0)
            )
        )
      )
    }
  }

  // have to be an arrow functions to keep `this` context when using detached, like
  // `global.addEventListener = mock.addEventListener`
  public addEventListener = (name: string, listener: EventListener): void => {
    let listeners = this.listeners.get(name)
    if (!listeners) {
      this.listeners.set(name, (listeners = []))
    }
    listeners.push(listener)
  }

  // have to be an arrow functions to keep `this` context when using detached, like
  // `global.removeEventListener = mock.removeEventListener`
  public removeEventListener = (
    name: string,
    listener: EventListener
  ): void => {
    const listeners = this.listeners.get(name)
    if (listeners && listeners.length > 0) {
      const idx = listeners.indexOf(listener) // listener MUST be the same reference
      if (idx >= 0) {
        listeners.splice(idx, 1)
      }
    }
  }
}

export function createEventsMock(): Events {
  return new EventsMock()
}
