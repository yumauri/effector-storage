import type { StorageAdapter } from '..'

/**
 * Nil/Void adapter
 */
export function nil(keyArea: any = ''): StorageAdapter {
  const adapter: StorageAdapter = () =>
    <any>{
      get() {}, // eslint-disable-line @typescript-eslint/no-empty-function
      set() {}, // eslint-disable-line @typescript-eslint/no-empty-function
    }

  adapter.keyArea = keyArea
  return adapter
}
