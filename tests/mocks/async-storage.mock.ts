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
    key = String(key)
    value = String(value)
    this.setCallback(key, value)
    this.storage.set(key, value)
  }

  public async getItem(key: string): Promise<string | null> {
    await Promise.resolve()
    key = String(key)
    this.getCallback(key)
    return this.storage.has(key) ? this.storage.get(key) ?? null : null
  }

  public async removeItem(key: string): Promise<void> {
    await Promise.resolve()
    key = String(key)
    this.removeCallback(key)
    this.storage.delete(key)
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
