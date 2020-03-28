import * as effector from 'effector'

export type StorageUnit = effector.Event<{ key: string; value: any }> & {
  fail: effector.Event<{ key: string; value: any; error: any }>
  get: (key: string) => effector.Event<any>
  set: (key: string) => effector.Event<{ key: string; value: any }>
}

export function createStorage(storage?: Storage | undefined): StorageUnit
