import type { ConfigPersist, Persist } from './types'
import { persist as base } from './persist'

export type {
  ConfigPersist,
  ConfigSourceTarget,
  ConfigStore,
  Done,
  Fail,
  Finally,
  Persist,
  StorageAdapter,
} from './types'
export { fp } from './fp-helper'

/**
 * Creates custom `persist`
 */
export function create(defaults?: ConfigPersist): Persist {
  return (config) => base({ ...defaults, ...config })
}

/**
 * Default `persist`
 */
export const persist = create()
