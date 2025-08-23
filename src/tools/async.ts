import type { StorageAdapter, StorageAdapterFactory } from '../types'

type Async = <A extends StorageAdapter | StorageAdapterFactory<any>>(
  adapter: A
) => A extends StorageAdapterFactory<infer T>
  ? StorageAdapterFactory<T>
  : StorageAdapter

/**
 * Makes synchronous storage adapter asynchronous
 */
export const async: Async = <T>(
  adapterOrFactory: StorageAdapter | StorageAdapterFactory<T>
): any => {
  const isFactory = 'factory' in adapterOrFactory

  const create: StorageAdapterFactory<T | void> = (config) => {
    const adapter: StorageAdapter = isFactory
      ? adapterOrFactory(config as T)
      : adapterOrFactory

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
