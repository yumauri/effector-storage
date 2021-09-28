import type { ConfigAdapter, ConfigCommon } from '../types'
import { persist as parent } from '..'
import { fp } from '../fp-helper'

export type {
  ConfigPersist,
  Done,
  Fail,
  Finally,
  Persist,
  StorageAdapter,
} from '..'

export interface ConfigStore<State, Err = Error>
  extends ConfigAdapter,
    ConfigCommon<State, Err> {}

/**
 * `persist` with curried `store`
 */
export const persist = fp<ConfigStore<any>>(parent)
