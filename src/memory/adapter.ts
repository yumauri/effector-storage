import type { StorageAdapter } from '..'

const data = new Map<string, any>()

export const memory: StorageAdapter = <State>(key: string) => ({
  get: () => data.get(key),
  set: (value: State) => data.set(key, value),
})
