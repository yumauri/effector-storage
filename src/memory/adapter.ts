import type { StorageAdapter } from '../types'

const data = new Map<string, any>()

export interface MemoryConfig {
  area?: Map<string, any>
  def?: any
}

/**
 * Memory adapter
 */
adapter.factory = true as const
export function adapter({
  area = data,
  def,
}: MemoryConfig = {}): StorageAdapter {
  const adapter: StorageAdapter = <State>(key: string) => ({
    get: () => area.get(key) ?? def,
    set: (value: State) => void area.set(key, value),
    remove: () => void area.delete(key),
  })

  adapter.keyArea = area
  return adapter
}
