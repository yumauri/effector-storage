import type { StorageAdapter } from '../src/types'
import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
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
  assert.type(persist, 'function')
  assert.type(createPersist, 'function')
  assert.type(createPersist(), 'function')
  assert.type(createPersist({ keyPrefix: 'app' }), 'function')
})

test('should be ok on good parameters', () => {
  const $store0 = createStore(0)
  const $store1 = createStore(0)
  const $store0named = createStore(0, { name: '_store0named_' })
  const $store1named = createStore(0, { name: '_store1named_' })
  assert.not.throws(() =>
    persist({ adapter: dumbAdapter, store: $store0, key: '_store0_' })
  )
  assert.not.throws(() =>
    persist({
      adapter: dumbAdapter,
      source: $store1,
      target: $store1,
      key: '_store1_',
    })
  )
  assert.not.throws(() =>
    persist({ adapter: dumbAdapter, store: $store0named })
  )
  assert.not.throws(() =>
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
  assert.type(unsubscribe, 'function')
  assert.type(unsubscribe.unsubscribe, 'function')

  const persistApp = createPersist({ keyPrefix: 'app' })
  const unsubscribeApp = persistApp({
    store: $store,
    adapter: dumbAdapter,
    key: 'test',
  })
  assert.type(unsubscribeApp, 'function')
  assert.type(unsubscribeApp.unsubscribe, 'function')
})

test('should restore value from adapter on store', () => {
  const watch = snoop(() => undefined)

  const $store = createStore(1)
  $store.watch(watch.fn)

  assert.is($store.getState(), 1)
  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [1])

  persist({ store: $store, adapter: dumbAdapter, key: 'test' })

  assert.is($store.getState(), 0)
  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[1].arguments, [0])
})

test('should sync stores, persisted to the same adapter-key', () => {
  const watch = snoop(() => undefined)

  const $store0 = createStore(1)
  const $store1 = createStore(2)
  $store0.watch(watch.fn)
  $store1.watch(watch.fn)

  assert.is($store0.getState(), 1)
  assert.is($store1.getState(), 2)
  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[0].arguments, [1])
  assert.equal(watch.calls[1].arguments, [2])

  persist({ store: $store0, adapter: dumbAdapter, key: 'same-key-1' })
  persist({ store: $store1, adapter: dumbAdapter, key: 'same-key-1' })

  assert.is($store0.getState(), 0)
  assert.is($store1.getState(), 0)
  assert.is(watch.callCount, 4)
  assert.equal(watch.calls[2].arguments, [0])
  assert.equal(watch.calls[3].arguments, [0])

  //
  ;($store0 as any).setState(3)

  assert.is($store0.getState(), 3)
  assert.is($store1.getState(), 3) // <- also changes
  assert.is(watch.callCount, 6)
  assert.equal(watch.calls[4].arguments, [3])
  assert.equal(watch.calls[5].arguments, [3])
})

test('should unsubscribe stores', () => {
  const watch = snoop(() => undefined)

  const $store0 = createStore(1)
  const $store1 = createStore(2)
  $store0.watch(watch.fn)
  $store1.watch(watch.fn)

  assert.is($store0.getState(), 1)
  assert.is($store1.getState(), 2)
  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[0].arguments, [1])
  assert.equal(watch.calls[1].arguments, [2])

  persist({ store: $store0, adapter: dumbAdapter, key: 'same-key-2' })
  const unsubscribe = persist({
    store: $store1,
    adapter: dumbAdapter,
    key: 'same-key-2',
  })

  assert.is($store0.getState(), 0)
  assert.is($store1.getState(), 0)
  assert.is(watch.callCount, 4)
  assert.equal(watch.calls[2].arguments, [0])
  assert.equal(watch.calls[3].arguments, [0])

  unsubscribe()

  //
  ;($store0 as any).setState(3)

  assert.is($store0.getState(), 3)
  assert.is($store1.getState(), 0) // <- same as before
  assert.is(watch.callCount, 5)
  assert.equal(watch.calls[4].arguments, [3])
})

//
// Launch tests
//

test.run()
