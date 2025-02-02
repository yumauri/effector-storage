import type { StorageAdapter } from '../types'

const data = new Map<string, any>()

export interface MemoryConfig {
  area?: Map<string, any>
}

/**
 * Memory adapter
 */
adapter.factory = true as const
export function adapter({ area = data }: MemoryConfig = {}): StorageAdapter {
  const adapter: StorageAdapter = <State>(key: string) => ({
    get: () => area.get(key),
    set: (value: State) => void area.set(key, value),
  })

  adapter.keyArea = area
  return adapter
}
