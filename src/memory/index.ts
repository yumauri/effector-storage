import type { Subscription } from 'effector'
import type {
  ConfigPersist as BaseConfigPersist,
  ConfigStore as BaseConfigStore,
  ConfigSourceTarget as BaseConfigSourceTarget,
} from '../types'
import { persist as base } from '../core'
import { adapter } from './adapter'

export type {
  Contract,
  Done,
  Fail,
  Finally,
  Adapter,
  DisposableAdapter,
  StorageAdapter,
  StorageAdapterFactory,
} from '../types'
export type { MemoryConfig } from './adapter'

export interface ConfigPersist extends BaseConfigPersist {}

export interface ConfigStore<State, Err = Error>
  extends BaseConfigStore<State, Err> {}

export interface ConfigSourceTarget<State, Err = Error>
  extends BaseConfigSourceTarget<State, Err> {}

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
export const createPersist =
  (defaults?: ConfigPersist): Persist =>
  (config) =>
    base({
      adapter: adapter(),
      ...defaults,
      ...config,
    })

/**
 * Default partially applied `persist`
 */
export const persist: Persist = /*#__PURE__*/ createPersist()
