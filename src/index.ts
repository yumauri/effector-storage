import type { ConfigPersist, Persist } from './types'
import { persist as base } from './core'

export type {
  ConfigPersist,
  ConfigSourceTarget,
  ConfigStore,
  Contract,
  Done,
  Fail,
  Finally,
  Persist,
  StorageAdapter,
  StorageAdapterFactory,
} from './types'

//
// reexport adapters
//

export type { AsyncStorageConfig } from './async-storage'
export type { LocalStorageConfig } from './local'
export type { LogConfig } from './log'
export type { MemoryConfig } from './memory'
export type { NilConfig } from './nil'
export type { QueryConfig } from './query'
export type { SessionStorageConfig } from './session'
export type { StorageConfig } from './storage'

export { asyncStorage } from './async-storage'
export { local } from './local'
export { log } from './log'
export { memory } from './memory'
export { nil } from './nil'
export { query } from './query'
export { session } from './session'
export { storage } from './storage'

//
// reexport tools
//

export { async, either, farcached } from './tools'

/**
 * Creates custom `persist`
 */
export function createPersist(defaults?: ConfigPersist): Persist {
  return (config: any) =>
    base({
      ...defaults,
      ...config,
    })
}

/**
 * Default `persist`
 */
export const persist: Persist = base
