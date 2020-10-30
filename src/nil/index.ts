import type { StorageAdapter } from '..'

/**
 * Nil/Void adapter
 */
export const nil: StorageAdapter = () =>
  <any>{
    get() {}, // eslint-disable-line @typescript-eslint/no-empty-function
    set() {}, // eslint-disable-line @typescript-eslint/no-empty-function
  }
