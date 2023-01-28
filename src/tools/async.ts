import type { StorageAdapter } from '../types'

/**
 * Makes synchronous storage adapter asynchronous
 */
export function async(adapter: StorageAdapter): StorageAdapter {
  const asyncAdapter: StorageAdapter = <State>(
    key: string,
    update: (raw?: any) => any
  ) => {
    const { get, set } = adapter<State>(key, update)
    return {
      get: (value: State) => Promise.resolve(value).then(get),
      set: (value?: any) => Promise.resolve(value).then(set),
    }
  }

  asyncAdapter.keyArea = adapter.keyArea
  asyncAdapter.noop = adapter.noop
  return asyncAdapter
}
