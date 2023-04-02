import type { StorageAdapter, StorageAdapterFactory } from '../types'

/**
 * Makes synchronous storage adapter asynchronous
 */

export function async<A extends StorageAdapter | StorageAdapterFactory<any>>(
  adapter: A
): A extends StorageAdapterFactory<infer T>
  ? StorageAdapterFactory<T>
  : StorageAdapter

export function async<T>(
  adapterOrFactory: StorageAdapter | StorageAdapterFactory<T>
): StorageAdapter | StorageAdapterFactory<T> {
  const isFactory = 'factory' in adapterOrFactory

  create.factory = true as const
  function create(config?: T) {
    const adapter = isFactory ? adapterOrFactory(config) : adapterOrFactory

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

  return isFactory ? create : create()
}
