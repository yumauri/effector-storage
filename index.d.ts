import * as effector from 'effector'

export type ErrorHandler = {
  (error: any): void
}

export type StorageStore<State> = effector.Store<State> & {
  catch(handler: ErrorHandler): StorageStore<State>
}

export type StoreCreator = <State>(
  defaultState: State,
  config: {
    key: string
    name?: string
    sid?: string
  }
) => StorageStore<State | null>

export function withStorage(
  createStore: typeof effector.createStore,
  storage?: Storage
): StoreCreator
