import effector = require('effector') // tslint:disable-line no-require-imports
import withStorage = require('./') // tslint:disable-line no-require-imports

// error handler interface
interface ErrorHandler {
  (error: any): void // tslint:disable-line no-any
}

// storage store interface
interface StorageStore<State> extends effector.Store<State> {
  /**
   * Get value from local/session storage,
   * SIC! In rare cases could be different, than value in store
   * (when storage value was changed from another window).
   * This method is used in ./sync to back-update store value
   */
  get<State>(value?: State): State | null

  /**
   * Set error handler
   */
  catch(handler: ErrorHandler): StorageStore<State>
}

/**
 * Wrapper factory for Effector's `createStore` function (also uses `createEvent` function),
 * creates store and "attaches" it to local/session storage,
 * also adds 'storage' event listener for back-updates of the store from storage
 *
 * @example
 *   import { createEvent, createStore } from 'effector'
 *   import withStorage from 'effector-storage/sync'
 *
 *   const increment = createEvent('increment')
 *   const decrement = createEvent('decrement')
 *   const resetCounter = createEvent('reset counter')
 *
 *   // ↓ create wrapper, uses localStorage by default
 *   const createStorageStore = withStorage(createStore, createEvent)
 *
 *   // ↓ or create wrapper, which uses sessionStorage
 *   // const createStorageStore = withStorage(createStore, createEvent, sessionStorage)
 *
 *   const counter = createStorageStore<number>(0, { key: 'counter' }) // ← use wrapper
 *     .catch(console.error) // ← error handling
 *     .on(increment, state => state + 1)
 *     .on(decrement, state => state - 1)
 *     .reset(resetCounter)
 */
export = function(
  createStore: typeof effector.createStore,
  createEvent: typeof effector.createEvent,
  storage?: Storage
) {
  // return `createStore` wrapper
  return <State>(
    defaultState: State,
    config: { key: string; name?: string; sid?: string }
  ): StorageStore<State | null> => {
    // create change event
    const change = createEvent<State | null>()

    // create storage store
    const store = withStorage(createStore, storage)<State>(
      defaultState,
      config
    ).on(change, (_, value) => value)

    // add 'storage' event listener
    // https://www.w3schools.com/jsref/event_storage_url.asp
    addEventListener('storage', function(e) {
      e.key === config.key && change(store.get())
    })

    // return modified effector store
    return store
  }
}
