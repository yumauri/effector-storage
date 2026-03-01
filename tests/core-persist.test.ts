import type { StorageAdapter } from '../src/types'
import { createEvent, createStore } from 'effector'
import { expect, it, vi } from 'vitest'
import { createPersist, persist } from '../src'

//
// Dumb fake adapter
//

const dumbAdapter: StorageAdapter = <T>() => {
  let __: T = 0 as any
  return {
    get: (): T => __,
    set: (value: T) => void (__ = value),
  }
}

//
// Tests
//

it('should exports function', () => {
  expect(typeof persist === 'function').toBeTruthy()
  expect(typeof createPersist === 'function').toBeTruthy()
  expect(typeof createPersist() === 'function').toBeTruthy()
  expect(typeof createPersist({ keyPrefix: 'app' }) === 'function').toBeTruthy()
})

it('should be ok on good parameters', () => {
  const $store0 = createStore(0)
  const $store1 = createStore(0)
  const $store0named = createStore(0, { name: '_store0named_' })
  const $store1named = createStore(0, { name: '_store1named_' })
  expect(() =>
    persist({ adapter: dumbAdapter, store: $store0, key: '_store0_' })
  ).not.toThrow()
  expect(() =>
    persist({
      adapter: dumbAdapter,
      source: $store1,
      target: $store1,
      key: '_store1_',
    })
  ).not.toThrow()
  expect(() =>
    persist({ adapter: dumbAdapter, store: $store0named })
  ).not.toThrow()
  expect(() =>
    persist({
      adapter: dumbAdapter,
      source: $store1named,
      target: $store1named,
    })
  ).not.toThrow()
})

it('should handle wrong parameters', () => {
  const event = createEvent<number>()
  const $store = createStore(0)
  expect(() => persist({} as any)).toThrow(/Adapter is not defined/)
  expect(() => persist({ adapter: dumbAdapter } as any)).toThrow(
    /Store or source is not defined/
  )
  expect(() => persist({ adapter: dumbAdapter, source: event } as any)).toThrow(
    /Target is not defined/
  )
  expect(() => persist({ adapter: dumbAdapter, target: event } as any)).toThrow(
    /Store or source is not defined/
  )
  expect(() => persist({ adapter: dumbAdapter, store: $store })).toThrow(
    /Key or name is not defined/
  )
  expect(() =>
    persist({ adapter: dumbAdapter, source: event, target: $store })
  ).toThrow(/Key or name is not defined/)
  expect(() =>
    persist({
      adapter: dumbAdapter,
      source: event,
      target: event,
      key: 'asdasd',
    })
  ).toThrow(/Source must be different from target/)
})

it('should return Subscription', () => {
  const $store = createStore(0)
  const unsubscribe = persist({
    store: $store,
    adapter: dumbAdapter,
    key: 'test',
  })
  expect(typeof unsubscribe === 'function').toBeTruthy()
  expect(typeof unsubscribe.unsubscribe === 'function').toBeTruthy()

  const persistApp = createPersist({ keyPrefix: 'app' })
  const unsubscribeApp = persistApp({
    store: $store,
    adapter: dumbAdapter,
    key: 'test',
  })
  expect(typeof unsubscribeApp === 'function').toBeTruthy()
  expect(typeof unsubscribeApp.unsubscribe === 'function').toBeTruthy()
})

it('should restore value from adapter on store', () => {
  const watch = vi.fn()

  const $store = createStore(1)
  $store.watch(watch)

  expect($store.getState()).toBe(1)
  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0]).toEqual([1])

  persist({ store: $store, adapter: dumbAdapter, key: 'test' })

  expect($store.getState()).toBe(0)
  expect(watch).toHaveBeenCalledTimes(2)
  expect(watch.mock.calls[1]).toEqual([0])
})

it('should sync stores, persisted to the same adapter-key', () => {
  const watch = vi.fn()

  const $store0 = createStore(1)
  const $store1 = createStore(2)
  $store0.watch(watch)
  $store1.watch(watch)

  expect($store0.getState()).toBe(1)
  expect($store1.getState()).toBe(2)
  expect(watch).toHaveBeenCalledTimes(2)
  expect(watch.mock.calls[0]).toEqual([1])
  expect(watch.mock.calls[1]).toEqual([2])

  persist({ store: $store0, adapter: dumbAdapter, key: 'same-key-1' })
  persist({ store: $store1, adapter: dumbAdapter, key: 'same-key-1' })

  expect($store0.getState()).toBe(0)
  expect($store1.getState()).toBe(0)
  expect(watch).toHaveBeenCalledTimes(4)
  expect(watch.mock.calls[2]).toEqual([0])
  expect(watch.mock.calls[3]).toEqual([0])

  //
  ;($store0 as any).setState(3)

  expect($store0.getState()).toBe(3)
  expect($store1.getState()).toBe(3) // <- also changes
  expect(watch).toHaveBeenCalledTimes(6)
  expect(watch.mock.calls[4]).toEqual([3])
  expect(watch.mock.calls[5]).toEqual([3])
})

it('should unsubscribe stores', () => {
  const watch = vi.fn()

  const $store0 = createStore(1)
  const $store1 = createStore(2)
  $store0.watch(watch)
  $store1.watch(watch)

  expect($store0.getState()).toBe(1)
  expect($store1.getState()).toBe(2)
  expect(watch).toHaveBeenCalledTimes(2)
  expect(watch.mock.calls[0]).toEqual([1])
  expect(watch.mock.calls[1]).toEqual([2])

  persist({ store: $store0, adapter: dumbAdapter, key: 'same-key-2' })
  const unsubscribe = persist({
    store: $store1,
    adapter: dumbAdapter,
    key: 'same-key-2',
  })

  expect($store0.getState()).toBe(0)
  expect($store1.getState()).toBe(0)
  expect(watch).toHaveBeenCalledTimes(4)
  expect(watch.mock.calls[2]).toEqual([0])
  expect(watch.mock.calls[3]).toEqual([0])

  unsubscribe()

  //
  ;($store0 as any).setState(3)

  expect($store0.getState()).toBe(3)
  expect($store1.getState()).toBe(0) // <- same as before
  expect(watch).toHaveBeenCalledTimes(5)
  expect(watch.mock.calls[4]).toEqual([3])
})
