import type { Subscription } from 'effector'
import type {
  ConfigPersist,
  ConfigCommon,
  ConfigJustStore,
  ConfigJustSourceTarget,
} from '../types'
import { persist as base } from '../core'
import { adapter } from './adapter'

export type {
  ConfigPersist,
  Done,
  Fail,
  Finally,
  StorageAdapter,
  StorageAdapterFactory,
} from '../types'
export type { MemoryConfig } from './adapter'

export interface ConfigStore<State, Err = Error>
  extends ConfigCommon<State, Err>,
    ConfigJustStore<State> {}

export interface ConfigSourceTarget<State, Err = Error>
  extends ConfigCommon<State, Err>,
    ConfigJustSourceTarget<State> {}

export interface Persist {
  <State, Err = Error>(config: ConfigSourceTarget<State, Err>): Subscription
  <State, Err = Error>(config: ConfigStore<State, Err>): Subscription
}

/**
 * Returns memory adapter
 */
export { adapter as memory }

/**
 * Creates custom partially applied `persist`
 * with predefined `memory` adapter
 */
export function createPersist(defaults?: ConfigPersist): Persist {
  return (config) =>
    base({
      adapter: adapter(),
      ...defaults,
      ...config,
    })
}

/**
 * Default partially applied `persist`
 */
export const persist = createPersist()
