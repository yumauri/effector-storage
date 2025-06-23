import type { StorageAdapter } from '../src/types'
import { test, mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { createEvent, createStore } from 'effector'
import { persist, createPersist } from '../src'

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

test('should exports function', () => {
  assert.ok(typeof persist === 'function')
  assert.ok(typeof createPersist === 'function')
  assert.ok(typeof createPersist() === 'function')
  assert.ok(typeof createPersist({ keyPrefix: 'app' }) === 'function')
})

test('should be ok on good parameters', () => {
  const $store0 = createStore(0)
  const $store1 = createStore(0)
  const $store0named = createStore(0, { name: '_store0named_' })
  const $store1named = createStore(0, { name: '_store1named_' })
  assert.doesNotThrow(() =>
    persist({ adapter: dumbAdapter, store: $store0, key: '_store0_' })
  )
  assert.doesNotThrow(() =>
    persist({
      adapter: dumbAdapter,
      source: $store1,
      target: $store1,
      key: '_store1_',
    })
  )
  assert.doesNotThrow(() =>
    persist({ adapter: dumbAdapter, store: $store0named })
  )
  assert.doesNotThrow(() =>
    persist({
      adapter: dumbAdapter,
      source: $store1named,
      target: $store1named,
    })
  )
})

test('should handle wrong parameters', () => {
  const event = createEvent<number>()
  const $store = createStore(0)
  assert.throws(() => persist({} as any), /Adapter is not defined/)
  assert.throws(
    () => persist({ adapter: dumbAdapter } as any),
    /Store or source is not defined/
  )
  assert.throws(
    () => persist({ adapter: dumbAdapter, source: event } as any),
    /Target is not defined/
  )
  assert.throws(
    () => persist({ adapter: dumbAdapter, target: event } as any),
    /Store or source is not defined/
  )
  assert.throws(
    () => persist({ adapter: dumbAdapter, store: $store }),
    /Key or name is not defined/
  )
  assert.throws(
    () => persist({ adapter: dumbAdapter, source: event, target: $store }),
    /Key or name is not defined/
  )
  assert.throws(
    () =>
      persist({
        adapter: dumbAdapter,
        source: event,
        target: event,
        key: 'asdasd',
      }),
    /Source must be different from target/
  )
})

test('should return Subscription', () => {
  const $store = createStore(0)
  const unsubscribe = persist({
    store: $store,
    adapter: dumbAdapter,
    key: 'test',
  })
  assert.ok(typeof unsubscribe === 'function')
  assert.ok(typeof unsubscribe.unsubscribe === 'function')

  const persistApp = createPersist({ keyPrefix: 'app' })
  const unsubscribeApp = persistApp({
    store: $store,
    adapter: dumbAdapter,
    key: 'test',
  })
  assert.ok(typeof unsubscribeApp === 'function')
  assert.ok(typeof unsubscribeApp.unsubscribe === 'function')
})

test('should restore value from adapter on store', () => {
  const watch = mock.fn()

  const $store = createStore(1)
  $store.watch(watch)

  assert.strictEqual($store.getState(), 1)
  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [1])

  persist({ store: $store, adapter: dumbAdapter, key: 'test' })

  assert.strictEqual($store.getState(), 0)
  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[1].arguments, [0])
})

test('should sync stores, persisted to the same adapter-key', () => {
  const watch = mock.fn()

  const $store0 = createStore(1)
  const $store1 = createStore(2)
  $store0.watch(watch)
  $store1.watch(watch)

  assert.strictEqual($store0.getState(), 1)
  assert.strictEqual($store1.getState(), 2)
  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[0].arguments, [1])
  assert.deepEqual(watch.mock.calls[1].arguments, [2])

  persist({ store: $store0, adapter: dumbAdapter, key: 'same-key-1' })
  persist({ store: $store1, adapter: dumbAdapter, key: 'same-key-1' })

  assert.strictEqual($store0.getState(), 0)
  assert.strictEqual($store1.getState(), 0)
  assert.strictEqual(watch.mock.callCount(), 4)
  assert.deepEqual(watch.mock.calls[2].arguments, [0])
  assert.deepEqual(watch.mock.calls[3].arguments, [0])

  //
  ;($store0 as any).setState(3)

  assert.strictEqual($store0.getState(), 3)
  assert.strictEqual($store1.getState(), 3) // <- also changes
  assert.strictEqual(watch.mock.callCount(), 6)
  assert.deepEqual(watch.mock.calls[4].arguments, [3])
  assert.deepEqual(watch.mock.calls[5].arguments, [3])
})

test('should unsubscribe stores', () => {
  const watch = mock.fn()

  const $store0 = createStore(1)
  const $store1 = createStore(2)
  $store0.watch(watch)
  $store1.watch(watch)

  assert.strictEqual($store0.getState(), 1)
  assert.strictEqual($store1.getState(), 2)
  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[0].arguments, [1])
  assert.deepEqual(watch.mock.calls[1].arguments, [2])

  persist({ store: $store0, adapter: dumbAdapter, key: 'same-key-2' })
  const unsubscribe = persist({
    store: $store1,
    adapter: dumbAdapter,
    key: 'same-key-2',
  })

  assert.strictEqual($store0.getState(), 0)
  assert.strictEqual($store1.getState(), 0)
  assert.strictEqual(watch.mock.callCount(), 4)
  assert.deepEqual(watch.mock.calls[2].arguments, [0])
  assert.deepEqual(watch.mock.calls[3].arguments, [0])

  unsubscribe()

  //
  ;($store0 as any).setState(3)

  assert.strictEqual($store0.getState(), 3)
  assert.strictEqual($store1.getState(), 0) // <- same as before
  assert.strictEqual(watch.mock.callCount(), 5)
  assert.deepEqual(watch.mock.calls[4].arguments, [3])
})
