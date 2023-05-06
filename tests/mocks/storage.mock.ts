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

  public setItem(key: string, value: string): void {
    key = String(key)
    value = String(value)
    this.setCallback(key, value)
    this.storage.set(key, value)
  }

  public getItem(key: string): string | null {
    key = String(key)
    this.getCallback(key)
    return this.storage.has(key) ? this.storage.get(key) ?? null : null
  }

  public removeItem(key: string): void {
    key = String(key)
    this.removeCallback(key)
    this.storage.delete(key)
  }

  public clear(): void {
    this.clearCallback()
    this.storage.clear()
  }

  public get length(): number {
    return this.storage.size
  }

  public key(n: number): string | null {
    const key = Array.from(this.storage.keys())[n]
    return key === undefined ? null : key
  }

  public _callbacks({
    getItem,
    setItem,
    removeItem,
    clear,
  }: Partial<Storage>): void {
    this.getCallback = getItem || noop
    this.setCallback = setItem || noop
    this.removeCallback = removeItem || noop
    this.clearCallback = clear || noop
  }
}

export function createStorageMock(): Storage {
  return new StorageMock()
}
