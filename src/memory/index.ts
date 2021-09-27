import type { Subscription } from 'effector'
import type {
  ConfigPersist,
  ConfigCommon,
  ConfigJustStore,
  ConfigJustSourceTarget,
} from '../types'
import { persist as base } from '../persist'
import { memory } from './adapter'

export type {
  ConfigPersist,
  Done,
  Fail,
  Finally,
  StorageAdapter,
} from '../types'

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
 * Creates custom partially applied `persist`
 * with predefined `memory` adapter
 */
export function create(defaults?: ConfigPersist): Persist {
  return (config) =>
    base({
      adapter: memory,
      ...defaults,
      ...config,
    })
}

/**
 * Default partially applied `persist`
 */
export const persist = create()
