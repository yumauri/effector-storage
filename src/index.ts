import type { ConfigPersist, Persist } from './types'
import { persist as base } from './core'

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

/**
 * Creates custom `persist`
 */
export function createPersist(defaults?: ConfigPersist): Persist {
  return (config) => base({ ...defaults, ...config })
}

/**
 * Default `persist`
 */
export const persist: Persist = base
