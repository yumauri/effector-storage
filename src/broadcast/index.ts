import type { Subscription } from 'effector'
import type {
  ConfigPersist as BaseConfigPersist,
  ConfigStore as BaseConfigStore,
  ConfigSourceTarget as BaseConfigSourceTarget,
  ConfigCreateStorage as BaseConfigCreateStorage,
  StorageAdapter,
  StorageHandles,
} from '../types'
import type { BroadcastConfig } from './adapter'
import { persist as base, createStorage as baseCreateStorage } from '../core'
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

export interface ConfigCreateStorage<State>
  extends BaseConfigCreateStorage<State> {}

export interface CreateStorage {
  <State, Err = Error>(
    key: string,
    config?: BroadcastConfig & BaseConfigCreateStorage<State>
  ): StorageHandles<State, Err>
  <State, Err = Error>(
    config: BroadcastConfig & BaseConfigCreateStorage<State> & { key: string }
  ): StorageHandles<State, Err>
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

/**
 * Creates custom partially applied `createStorage`
 * with predefined BroadcastChannel adapter
 */
export function createStorageFactory(
  defaults?: ConfigCreateStorage<any>
): CreateStorage {
  return (...configs: any[]) =>
    baseCreateStorage({ adapter: broadcast }, defaults, ...configs)
}

/**
 * Default partially applied `createStorage`
 */
export const createStorage = /*#__PURE__*/ createStorageFactory()
