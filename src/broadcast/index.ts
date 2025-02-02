import type { Subscription } from 'effector'
import type {
  ConfigPersist as BaseConfigPersist,
  ConfigStore as BaseConfigStore,
  ConfigSourceTarget as BaseConfigSourceTarget,
  StorageAdapter,
} from '../types'
import type { BroadcastConfig } from './adapter'
import { persist as base } from '../core'
import { nil } from '../nil'
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
export type { BroadcastConfig } from './adapter'

export interface ConfigPersist extends BaseConfigPersist {}

export interface ConfigStore<State, Err = Error>
  extends BroadcastConfig,
    BaseConfigStore<State, Err> {}

export interface ConfigSourceTarget<State, Err = Error>
  extends BroadcastConfig,
    BaseConfigSourceTarget<State, Err> {}

export interface Persist {
  <State, Err = Error>(config: ConfigSourceTarget<State, Err>): Subscription
  <State, Err = Error>(config: ConfigStore<State, Err>): Subscription
}

/**
 * Function, checking if `BroadcastChannel` exists and accessible
 */
function supports() {
  return typeof BroadcastChannel !== 'undefined'
}

/**
 * Creates BroadcastChannel adapter
 */
broadcast.factory = true as const
export function broadcast(config?: BroadcastConfig): StorageAdapter {
  return supports()
    ? adapter({
        ...config,
      })
    : nil({ keyArea: 'broadcast' })
}

/**
 * Creates custom partially applied `persist`
 * with predefined BroadcastChannel adapter
 */
export function createPersist(defaults?: ConfigPersist): Persist {
  return (config) =>
    base({
      adapter: broadcast,
      ...defaults,
      ...config,
    })
}

/**
 * Default partially applied `persist`
 */
export const persist = /*#__PURE__*/ createPersist()
