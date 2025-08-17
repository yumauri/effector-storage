import type { StorageAdapter } from '../types'

export interface NilConfig {
  keyArea?: any
}

/**
 * Nil/Void adapter
 */
export function nil({ keyArea = '' }: NilConfig = {}): StorageAdapter {
  const adapter: StorageAdapter = () =>
    ({
      get() {},
      set() {},
    }) as any

  adapter.keyArea = keyArea
  adapter.noop = true
  return adapter
}

export namespace nil {
  export const factory = true
}
