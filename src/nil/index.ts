import type { StorageAdapter } from '../types'

export interface NilConfig {
  keyArea?: any
}

/**
 * Nil/Void adapter
 */
nil.factory = true as const
export function nil({ keyArea = '' }: NilConfig = {}): StorageAdapter {
  const adapter: StorageAdapter = () =>
    <any>{
      get() {}, // eslint-disable-line @typescript-eslint/no-empty-function
      set() {}, // eslint-disable-line @typescript-eslint/no-empty-function
    }

  adapter.keyArea = keyArea
  adapter.noop = true
  return adapter
}
