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
    ({
      get() {},
      set() {},
    }) as any

  adapter.keyArea = keyArea
  adapter.noop = true
  return adapter
}
