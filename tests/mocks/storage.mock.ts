const noop: any = () => undefined

export class StorageMock implements Storage {
  private storage = new Map<string, string>()

  private getCallback: (key: string) => string | null = noop
  private setCallback: (key: string, value: string) => void = noop
  private removeCallback: (key: string) => void = noop
  private clearCallback: () => void = noop

  constructor() {
    // biome-ignore lint/correctness/noConstructorReturn: this is a escape hatch for testing purposes
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
    const k = String(key)
    const v = String(value)
    this.setCallback(k, v)
    this.storage.set(k, v)
  }

  public getItem(key: string): string | null {
    const k = String(key)
    this.getCallback(k)
    return this.storage.has(k) ? (this.storage.get(k) ?? null) : null
  }

  public removeItem(key: string): void {
    const k = String(key)
    this.removeCallback(k)
    this.storage.delete(k)
  }

  public clear(): void {
    this.clearCallback()
    this.storage.clear()
  }

  public get length(): number {
    return this.storage.size
  }

  public key(n: number): string | null {
    const k = Array.from(this.storage.keys())[n]
    return k === undefined ? null : k
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
