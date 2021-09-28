import type { AdapterConfig } from '..'
import type { ConfigCommon } from '../../types'
import { persist as parent } from '..'
import { fp } from '../../fp-helper'

export type {
  ConfigPersist,
  Done,
  Fail,
  Finally,
  Persist,
  StorageAdapter,
} from '..'

export interface ConfigStore<State, Err = Error>
  extends AdapterConfig,
    ConfigCommon<State, Err> {}

/**
 * Partially applied `persist` with predefined `localStorage` adapter and curried `store`
 */
export const persist = fp<ConfigStore<any>>(parent)
