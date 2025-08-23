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
  adapterOrFactory: StorageAdapter | StorageAdapterFactory<T | undefined | void>
): StorageAdapter | StorageAdapterFactory<T> {
  const isFactory = 'factory' in adapterOrFactory

  const create: StorageAdapterFactory<T | undefined | void> = (config) => {
    const adapter = isFactory ? adapterOrFactory(config) : adapterOrFactory

    const asyncAdapter: StorageAdapter = <State>(
      key: string,
      update: (raw?: any) => void
    ) => {
      const { get, set } = adapter<State>(key, update)
      return {
        get: async (value?: any, ctx?: any) => get(await value, ctx),
        set: async (value: State, ctx?: any) => set(await value, ctx),
      }
    }

    asyncAdapter.keyArea = adapter.keyArea
    asyncAdapter.noop = adapter.noop
    return asyncAdapter
  }

  // mark as factory
  create.factory = true

  return isFactory ? create : create()
}
