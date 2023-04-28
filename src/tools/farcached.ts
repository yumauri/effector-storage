import type { StorageAdapter } from '../types'
import type { CacheAdapter } from '@farfetched/core'
import { attach } from 'effector'

/**
 * Wraps @farfetched/core cache adapter to be used as `persist` adapter :)
 * @see https://farfetched.pages.dev/api/operators/cache.html
 *
 * persist({
 *   store: $store,
 *   adapter: farcached(localStorageCache({ maxAge: '15m' })),
 *   key: 'store'
 * })
 *
 * Out of the box Farfetched provides 4 cache adapters:
 * - `inMemoryCache`
 * - `sessionStorageCache`
 * - `localStorageCache`
 * - `voidCache` (this one is noop)
 *
 * From real usage point of view, using Farfetched cache adapters could be useful,
 * when you need logic for cache invalidation, because all of provided adapters
 * have `maxAge` option.
 *
 * Also, you could use Farfetched cache adapters to inject different
 * cache adapters with `fork` using `cache.__.$instance` internal store.
 * @see https://farfetched.pages.dev/recipes/server_cache.html#inject-adapter
 */

export function farcached(
  adapter: CacheAdapter,
  keyArea?: any
): StorageAdapter {
  const farfetchedAdapter: StorageAdapter = <State>(key: string) => {
    return {
      get: attach({
        source: adapter.__.$instance,
        async effect(instance: CacheAdapter) {
          const persisted = await instance.get({ key })
          return persisted?.value as State
        },
      } as any),
      set: attach({
        source: adapter.__.$instance,
        async effect(instance: CacheAdapter, value?: any) {
          return instance.set({ key, value })
        },
      } as any),
    }
  }

  farfetchedAdapter.keyArea = keyArea ?? adapter
  return farfetchedAdapter
}
