import type { AsyncStorage } from '../../src/async-storage'

const noop: any = () => undefined

export class AsyncStorageMock implements AsyncStorage {
  private storage = new Map<string, string>()

  private getCallback: (key: string) => string | null = noop
  private setCallback: (key: string, value: string) => void = noop
  private removeCallback: (key: string) => void = noop
  private clearCallback: () => void = noop

  public async setItem(key: string, value: string): Promise<void> {
    await Promise.resolve()
    const k = String(key)
    const v = String(value)
    this.setCallback(k, v)
    this.storage.set(k, v)
  }

  public async getItem(key: string): Promise<string | null> {
    await Promise.resolve()
    const k = String(key)
    this.getCallback(k)
    return this.storage.has(k) ? (this.storage.get(k) ?? null) : null
  }

  public async removeItem(key: string): Promise<void> {
    await Promise.resolve()
    const k = String(key)
    this.removeCallback(k)
    this.storage.delete(k)
  }

  public async clear(): Promise<void> {
    await Promise.resolve()
    this.clearCallback()
    this.storage.clear()
  }

  public _callbacks({
    getItem,
    setItem,
    removeItem,
    clear,
  }: Partial<AsyncStorageMock>): void {
    this.getCallback = getItem || noop
    this.setCallback = setItem || noop
    this.removeCallback = removeItem || noop
    this.clearCallback = clear || noop
  }
}

export function createAsyncStorageMock(): AsyncStorage {
  return new AsyncStorageMock()
}
