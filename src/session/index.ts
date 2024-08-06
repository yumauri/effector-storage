import type { Subscription } from 'effector'
import type {
  ConfigPersist as BaseConfigPersist,
  ConfigStore as BaseConfigStore,
  ConfigSourceTarget as BaseConfigSourceTarget,
  ConfigCreateStorage as BaseConfigCreateStorage,
  StorageAdapter,
  StorageHandles,
} from '../types'
import { persist as base, createStorage as baseCreateStorage } from '../core'
import { nil } from '../nil'
import { storage } from '../storage'

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

export interface ConfigPersist extends BaseConfigPersist {
  sync?: boolean | 'force'
  timeout?: number
}

export interface SessionStorageConfig {
  sync?: boolean | 'force'
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
  timeout?: number
  def?: any
}

export interface ConfigStore<State, Err = Error>
  extends SessionStorageConfig,
    BaseConfigStore<State, Err> {}

export interface ConfigSourceTarget<State, Err = Error>
  extends SessionStorageConfig,
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
    config?: SessionStorageConfig & BaseConfigCreateStorage<State>
  ): StorageHandles<State, Err>
  <State, Err = Error>(
    config: SessionStorageConfig &
      BaseConfigCreateStorage<State> & { key: string }
  ): StorageHandles<State, Err>
}

/**
 * Function, checking if `sessionStorage` exists
 */
function supports() {
  try {
    return typeof sessionStorage !== 'undefined'
  } catch (error) {
    // accessing `sessionStorage` could throw an exception only in one case -
    // when `sessionStorage` IS supported, but blocked by security policies
    return true
  }
}

/**
 * Creates `sessionStorage` adapter
 */
session.factory = true as const
export function session(config?: SessionStorageConfig): StorageAdapter {
  return supports()
    ? storage({
        storage: () => sessionStorage,
        ...config,
      })
    : nil({ keyArea: 'session' })
}

/**
 * Creates custom partially applied `persist`
 * with predefined `sessionStorage` adapter
 */
export function createPersist(defaults?: ConfigPersist): Persist {
  return (config) =>
    base({
      adapter: session,
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
 * with predefined `sessionStorage` adapter
 */
export function createStorageFactory(
  defaults?: ConfigCreateStorage<any>
): CreateStorage {
  return (...configs: any[]) =>
    baseCreateStorage({ adapter: session }, defaults, ...configs)
}

/**
 * Default partially applied `createStorage`
 */
export const createStorage = /*#__PURE__*/ createStorageFactory()
