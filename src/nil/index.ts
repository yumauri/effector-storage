import type { StorageAdapter, StorageAdapterFactory } from '../types'

export interface NilConfig {
  keyArea?: any
}

/**
 * Nil/Void adapter
 */
export const nil: StorageAdapterFactory<NilConfig | undefined | void> = ({
  keyArea = '',
} = {}) => {
  const adapter: StorageAdapter = () =>
    ({
      get() {},
      set() {},
    }) as any

  adapter.keyArea = keyArea
  adapter.noop = true
  return adapter
}

// mark as factory
nil.factory = true
