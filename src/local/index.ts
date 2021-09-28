import type { Subscription } from 'effector'
import type {
  ConfigPersist as BaseConfigPersist,
  ConfigCommon,
  ConfigJustStore,
  ConfigJustSourceTarget,
} from '../types'
import { persist as base } from '../persist'
import { nil } from '../nil'
import { storage } from '../storage'

export type { Done, Fail, Finally, StorageAdapter } from '../types'

export interface ConfigPersist extends BaseConfigPersist {
  sync?: boolean
}

export interface AdapterConfig {
  sync?: boolean
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
}

export interface ConfigStore<State, Err = Error>
  extends AdapterConfig,
    ConfigCommon<State, Err>,
    ConfigJustStore<State> {}

export interface ConfigSourceTarget<State, Err = Error>
  extends AdapterConfig,
    ConfigCommon<State, Err>,
    ConfigJustSourceTarget<State> {}

export interface Persist {
  <State, Err = Error>(config: ConfigSourceTarget<State, Err>): Subscription
  <State, Err = Error>(config: ConfigStore<State, Err>): Subscription
}

/**
 * Creates custom partially applied `persist`
 * with predefined `localStorage` adapter
 */
export function create(defaults?: ConfigPersist): Persist {
  return (config) =>
    base({
      adapter:
        typeof localStorage !== 'undefined'
          ? storage({
              storage: localStorage,
              sync: true,
              ...defaults,
              ...config,
            })
          : nil('local'),
      ...defaults,
      ...config,
    })
}

/**
 * Default partially applied `persist`
 */
export const persist = create()
