const noop: any = () => undefined

export class StorageMock implements Storage {
  private storage = new Map<string, string>()

  private getCallback: (key: string) => string | null = noop
  private setCallback: (key: string, value: string) => void = noop
  private removeCallback: (key: string) => void = noop
  private clearCallback: () => void = noop

  constructor() {
    return new Proxy(this, {
      get(target, property, receiver) {
        if (property in target) {
          return Reflect.get(target, property, receiver)
        }
        return target.storage.get(String(property))
      },
      set(target, property, value, receiver) {
        if (property in target) {
          return Reflect.set(target, property, value, receiver)
        }
        target.storage.set(String(property), String(value))
        return true
      },
    })
  }

  public setItem(key: string, value: string) {
    key = String(key)
    value = String(value)
    this.setCallback(key, value)
    this.storage.set(key, value)
  }

  public getItem(key: string) {
    key = String(key)
    this.getCallback(key)
    return this.storage.has(key) ? this.storage.get(key) ?? null : null
  }

  public removeItem(key: string) {
    key = String(key)
    this.removeCallback(key)
    this.storage.delete(key)
  }

  public clear() {
    this.clearCallback()
    this.storage.clear()
  }

  public get length() {
    return this.storage.size
  }

  public key(n: number) {
    const key = Array.from(this.storage.keys())[n]
    return key === undefined ? null : key
  }

  public _callbacks(
    get: typeof StorageMock.prototype.getCallback | null,
    set: typeof StorageMock.prototype.setCallback | null,
    remove: typeof StorageMock.prototype.removeCallback | null,
    clear: typeof StorageMock.prototype.clearCallback | null
  ) {
    this.getCallback = get === null ? noop : get
    this.setCallback = set === null ? noop : set
    this.removeCallback = remove === null ? noop : remove
    this.clearCallback = clear === null ? noop : clear
  }
}

export function createStorageMock(): Storage {
  return new StorageMock()
}
