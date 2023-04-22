import type { AsyncStorage } from '../../src/async-storage'

const noop: any = () => undefined

export class AsyncStorageMock implements AsyncStorage {
  private storage = new Map<string, string>()

  private getCallback: (key: string) => string | null = noop
  private setCallback: (key: string, value: string) => void = noop
  private removeCallback: (key: string) => void = noop
  private clearCallback: () => void = noop

  public async setItem(key: string, value: string) {
    await Promise.resolve()
    key = String(key)
    value = String(value)
    this.setCallback(key, value)
    this.storage.set(key, value)
  }

  public async getItem(key: string) {
    await Promise.resolve()
    key = String(key)
    this.getCallback(key)
    return this.storage.has(key) ? this.storage.get(key) ?? null : null
  }

  public async removeItem(key: string) {
    await Promise.resolve()
    key = String(key)
    this.removeCallback(key)
    this.storage.delete(key)
  }

  public async clear() {
    await Promise.resolve()
    this.clearCallback()
    this.storage.clear()
  }

  public _callbacks(
    get: typeof AsyncStorageMock.prototype.getCallback | null,
    set: typeof AsyncStorageMock.prototype.setCallback | null,
    remove: typeof AsyncStorageMock.prototype.removeCallback | null,
    clear: typeof AsyncStorageMock.prototype.clearCallback | null
  ) {
    this.getCallback = get === null ? noop : get
    this.setCallback = set === null ? noop : set
    this.removeCallback = remove === null ? noop : remove
    this.clearCallback = clear === null ? noop : clear
  }
}

export function createAsyncStorageMock(): AsyncStorage {
  return new AsyncStorageMock()
}
