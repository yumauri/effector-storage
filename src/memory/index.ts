import type { Subscription } from 'effector'
import type {
  ConfigPersist as BaseConfigPersist,
  ConfigStore as BaseConfigStore,
  ConfigSourceTarget as BaseConfigSourceTarget,
  ConfigCreateStorage as BaseConfigCreateStorage,
  StorageHandles,
} from '../types'
import { persist as base, createStorage as baseCreateStorage } from '../core'
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

export interface ConfigCreateStorage<State>
  extends BaseConfigCreateStorage<State> {}

export interface CreateStorage {
  <State, Err = Error>(
    key: string,
    config?: BaseConfigCreateStorage<State>
  ): StorageHandles<State, Err>
  <State, Err = Error>(
    config: BaseConfigCreateStorage<State> & { key: string }
  ): StorageHandles<State, Err>
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
export const persist = /*#__PURE__*/ createPersist()

/**
 * Creates custom partially applied `createStorage`
 * with predefined `memory` adapter
 */
export function createStorageFactory(
  defaults?: ConfigCreateStorage<any>
): CreateStorage {
  return (...configs: any[]) =>
    baseCreateStorage({ adapter: adapter() }, defaults, ...configs)
}

/**
 * Default partially applied `createStorage`
 */
export const createStorage = /*#__PURE__*/ createStorageFactory()
