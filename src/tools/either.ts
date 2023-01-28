import type { StorageAdapter } from '../types'

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
 */
export function either(
  one: StorageAdapter,
  another: StorageAdapter
): StorageAdapter {
  return one.noop ? another : one
}
