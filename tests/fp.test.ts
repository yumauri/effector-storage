import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore, createDomain, is } from 'effector'
import { StorageAdapter } from '../src'
import { persist } from '../src/fp'

//
// Dumb fake adapter
//

const dumbAdapter: StorageAdapter = <T>() => {
  let __: T = 0 as any
  return {
    get: (): T => __,
    set: (value: T) => (__ = value),
  }
}

//
// Tests
//

test('should export `persist` function', () => {
  assert.type(persist, 'function')
})

test('should return Store', () => {
  const $store0 = createStore(0, { name: 'fp::store0' })
  const $store1 = persist({ adapter: dumbAdapter })($store0)
  assert.ok(is.store($store1))
  assert.ok($store1 === $store0)
})

test('should call watcher once', () => {
  const watch = snoop(() => undefined)

  const $store = createStore(1).thru(
    persist({ adapter: dumbAdapter, key: 'fp::store1' })
  )
  $store.watch(watch.fn)

  assert.is($store.getState(), 0)
  assert.is($store.defaultState, 1)

  // call watcher once
  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [0])
})

test('should call watcher twice', () => {
  const watch = snoop(() => undefined)

  const $store = createStore(1, { name: 'fp::store2name' })
  $store.watch(watch.fn)
  $store.thru(persist({ adapter: dumbAdapter, key: 'fp::store2key' }))

  assert.is($store.getState(), 0)
  assert.is($store.defaultState, 1)

  // call watcher twice
  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[0].arguments, [1])
  assert.equal(watch.calls[1].arguments, [0])
})

test('should call watcher once if persisted in domain hook', () => {
  const watch = snoop(() => undefined)
  const root = createDomain()

  root.onCreateStore(persist({ adapter: dumbAdapter }))

  const $store = root.createStore(1, { name: 'fp::store3' })
  $store.watch(watch.fn)

  assert.is($store.getState(), 0)
  assert.is($store.defaultState, 1)

  // call watcher once
  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [0])
})

//
// Launch tests
//

test.run()
