import type { ConfigPersist, Persist } from './types'
import { persist as basePersist } from './core'

export type {
  ConfigPersist,
  ConfigSourceTarget,
  ConfigStore,
  Contract,
  Done,
  Fail,
  Finally,
  Persist,
  Adapter,
  DisposableAdapter,
  StorageAdapter,
  StorageAdapterFactory,
} from './types'

//
// reexport adapters
//

export type { AsyncStorageConfig } from './async-storage'
export type { BroadcastConfig } from './broadcast'
export type { LocalStorageConfig } from './local'
export type { LogConfig } from './log'
export type { MemoryConfig } from './memory'
export type { NilConfig } from './nil'
export type { QueryConfig } from './query'
export type { SessionStorageConfig } from './session'
export type { StorageConfig } from './storage'

export { asyncStorage } from './async-storage'
export { broadcast } from './broadcast'
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
    basePersist({
      ...defaults,
      ...config,
    })
}

/**
 * Default `persist`
 */
export const persist: Persist = basePersist
