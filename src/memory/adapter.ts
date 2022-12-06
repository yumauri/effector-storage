import type { StorageAdapter } from '..'

const data = new Map<string, any>()

export function memory(area: Map<string, any> = data): StorageAdapter {
  const adapter: StorageAdapter = <State>(key: string) => ({
    get: () => area.get(key),
    set: (value: State) => area.set(key, value),
  })

  adapter.keyArea = area
  return adapter
}
