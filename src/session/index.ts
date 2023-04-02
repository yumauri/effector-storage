import type { Subscription } from 'effector'
import type {
  ConfigPersist as BaseConfigPersist,
  ConfigCommon,
  ConfigJustStore,
  ConfigJustSourceTarget,
  StorageAdapter,
} from '../types'
import { persist as base } from '../core'
import { nil } from '../nil'
import { storage } from '../storage'

export type {
  Done,
  Fail,
  Finally,
  StorageAdapter,
  StorageAdapterFactory,
} from '../types'

export interface ConfigPersist extends BaseConfigPersist {
  sync?: boolean
}

export interface SessionStorageConfig {
  sync?: boolean
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
  def?: any
}

export interface ConfigStore<State, Err = Error>
  extends SessionStorageConfig,
    ConfigCommon<State, Err>,
    ConfigJustStore<State> {}

export interface ConfigSourceTarget<State, Err = Error>
  extends SessionStorageConfig,
    ConfigCommon<State, Err>,
    ConfigJustSourceTarget<State> {}

export interface Persist {
  <State, Err = Error>(config: ConfigSourceTarget<State, Err>): Subscription
  <State, Err = Error>(config: ConfigStore<State, Err>): Subscription
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
export const persist = createPersist()
