interface EventListener {
  (event: any): void
}

interface Events {
  dispatchEvent(name: string, event: any): Promise<any>
  addEventListener(name: string, listener: EventListener): void
}

export class EventsMock implements Events {
  private listeners = new Map<string, EventListener[]>()

  public async dispatchEvent(name: string, event: any) {
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

  public addEventListener = (name: string, listener: EventListener) => {
    let listeners = this.listeners.get(name)
    if (!listeners) {
      this.listeners.set(name, (listeners = []))
    }
    listeners.push(listener)
  }
}

export function createEventsMock(): Events {
  return new EventsMock()
}
