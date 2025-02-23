import type { Subscription } from 'effector'
import type {
  ConfigPersist as BaseConfigPersist,
  ConfigStore as BaseConfigStore,
  ConfigSourceTarget as BaseConfigSourceTarget,
  StorageAdapter,
} from '../types'
import { persist as base } from '../core'
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

export interface LocalStorageConfig {
  sync?: boolean | 'force'
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
  timeout?: number
  def?: any
}

export interface ConfigStore<State, Err = Error>
  extends LocalStorageConfig,
    BaseConfigStore<State, Err> {}

export interface ConfigSourceTarget<State, Err = Error>
  extends LocalStorageConfig,
    BaseConfigSourceTarget<State, Err> {}

export interface Persist {
  <State, Err = Error>(config: ConfigSourceTarget<State, Err>): Subscription
  <State, Err = Error>(config: ConfigStore<State, Err>): Subscription
}

/**
 * Function, checking if `localStorage` exists
 */
function supports() {
  try {
    return typeof localStorage !== 'undefined'
  } catch (_error) {
    // accessing `localStorage` could throw an exception only in one case -
    // when `localStorage` IS supported, but blocked by security policies
    return true
  }
}

/**
 * Creates `localStorage` adapter
 */
local.factory = true as const
export function local(config?: LocalStorageConfig): StorageAdapter {
  return supports()
    ? storage({
        storage: () => localStorage,
        sync: true,
        ...config,
      })
    : nil({ keyArea: 'local' })
}

/**
 * Creates custom partially applied `persist`
 * with predefined `localStorage` adapter
 */
export function createPersist(defaults?: ConfigPersist): Persist {
  return (config) =>
    base({
      adapter: local,
      ...defaults,
      ...config,
    })
}

/**
 * Default partially applied `persist`
 */
export const persist = /*#__PURE__*/ createPersist()
