import type { Subscription } from 'effector'
import type {
  ConfigPersist as BaseConfigPersist,
  ConfigStore as BaseConfigStore,
  ConfigSourceTarget as BaseConfigSourceTarget,
  ConfigCreateStorage as BaseConfigCreateStorage,
  StorageAdapter,
  StorageHandles,
} from '../types'
import type { ChangeMethod, StateBehavior, QueryConfig } from './adapter'
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
export type { ChangeMethod, StateBehavior, QueryConfig } from './adapter'
export {
  locationAssign,
  locationReplace,
  pushState,
  replaceState,
} from './adapter'

export interface ConfigPersist extends BaseConfigPersist {
  method?: ChangeMethod
  state?: StateBehavior
  timeout?: number
}

export interface ConfigStore<State, Err = Error>
  extends QueryConfig,
    BaseConfigStore<State, Err> {}

export interface ConfigSourceTarget<State, Err = Error>
  extends QueryConfig,
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
    config?: QueryConfig & BaseConfigCreateStorage<State>
  ): StorageHandles<State, Err>
  <State, Err = Error>(
    config: QueryConfig & BaseConfigCreateStorage<State> & { key: string }
  ): StorageHandles<State, Err>
}

/**
 * Function, checking if `history` and `location` exists and accessible
 */
function supports() {
  return typeof history !== 'undefined' && typeof location !== 'undefined'
}

/**
 * Creates query string adapter
 */
query.factory = true as const
export function query(config?: QueryConfig): StorageAdapter {
  return supports()
    ? adapter({
        ...config,
      })
    : nil({ keyArea: 'query' })
}

/**
 * Creates custom partially applied `persist`
 * with predefined `query` adapter
 */
export function createPersist(defaults?: ConfigPersist): Persist {
  return (config) =>
    base({
      adapter: query,
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
 * with predefined `query` adapter
 */
export function createStorageFactory(
  defaults?: ConfigCreateStorage<any>
): CreateStorage {
  return (...configs: any[]) =>
    baseCreateStorage({ adapter: query }, defaults, ...configs)
}

/**
 * Default partially applied `createStorage`
 */
export const createStorage = /*#__PURE__*/ createStorageFactory()
