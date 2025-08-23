import type { StorageAdapter, StorageAdapterFactory } from '../types'

type Either = <
  A1 extends StorageAdapter | StorageAdapterFactory<any>,
  A2 extends StorageAdapter | StorageAdapterFactory<any>,
>(
  one: A1,
  another: A2
) => A1 extends StorageAdapterFactory<infer T1>
  ? A2 extends StorageAdapterFactory<infer T2>
    ? StorageAdapterFactory<T1 & T2>
    : StorageAdapterFactory<T1>
  : A2 extends StorageAdapterFactory<infer T2>
    ? StorageAdapterFactory<T2>
    : StorageAdapter

/**
 * Returns first adapter, if it is not noop, and second otherwise.
 *
 * In this example,
 *  - adapter for localStorage will be used in browser environment,
 *  - logging adapter will be used in node environment
 *
 * persist({
 *   store: $store,
 *   adapter: either(local(), log()),
 *   key: 'store'
 * })
 *
 * could be also used with factories
 *
 * persist({
 *   store: $store,
 *   adapter: either(local, log),
 *   key: 'store'
 * })
 *
 * or even mixed
 *
 * persist({
 *   store: $store,
 *   adapter: either(local, log()),
 *   key: 'store'
 * })
 */
export const either: Either = <T1, T2>(
  one: StorageAdapter | StorageAdapterFactory<T1 | void>,
  another: StorageAdapter | StorageAdapterFactory<T2 | void>
): any => {
  const isFactory1 = 'factory' in one
  const isFactory2 = 'factory' in another

  const create: StorageAdapterFactory<(T1 & T2) | void> = (config) => {
    const adapter1: StorageAdapter = isFactory1 ? one(config) : one
    const adapter2: StorageAdapter = isFactory2 ? another(config) : another
    return adapter1.noop ? adapter2 : adapter1
  }

  // mark as factory
  create.factory = true

  return isFactory1 || isFactory2 ? create : create()
}
