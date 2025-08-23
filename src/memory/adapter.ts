import type { StorageAdapter, StorageAdapterFactory } from '../types'

const data = new Map<string, any>()

export interface MemoryConfig {
  area?: Map<string, any>
}

/**
 * Memory adapter
 */
export const adapter: StorageAdapterFactory<
  MemoryConfig | undefined | void
> = ({ area = data } = {}) => {
  const adapter: StorageAdapter = <State>(key: string) => ({
    get: () => area.get(key),
    set: (value: State) => void area.set(key, value),
  })

  adapter.keyArea = area
  return adapter
}

// mark as factory
adapter.factory = true
