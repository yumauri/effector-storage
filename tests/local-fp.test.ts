import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore, createDomain, is } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { createEventsMock } from './mocks/events.mock'
import { persist } from '../src/local/fp'

//
// Mock `localStorage` and events
//

declare let global: any

test.before(() => {
  global.localStorage = createStorageMock()
  global.addEventListener = createEventsMock().addEventListener
})

test.after(() => {
  delete global.localStorage
  delete global.addEventListener
})

//
// Tests
//

test('should export adapter and `persist` function', () => {
  assert.type(persist, 'function')
})

test('should be ok on good parameters', () => {
  const $store = createStore(0, { name: 'local-fp::store' })
  assert.not.throws(() => persist()($store))
})

test('should return Store', () => {
  const $store0 = createStore(0)
  const $store1 = persist({ key: 'local-fp::store0' })($store0)
  assert.ok(is.store($store1))
  assert.ok($store1 === $store0)
})

test('should be possible to use with .thru()', () => {
  localStorage.setItem('store-key-1', '111')

  const watch = snoop(() => undefined)

  assert.is(localStorage.getItem('store-key-1'), '111')
  const $store = createStore(1).thru(persist({ key: 'store-key-1' }))
  $store.watch(watch.fn)

  assert.is($store.getState(), 111)
  assert.is($store.defaultState, 1)

  // call watcher once
  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [111])
})

test('should be possible to use with domain hook', () => {
  localStorage.setItem('store-key-2', '222')

  const watch = snoop(() => undefined)
  const root = createDomain()

  root.onCreateStore(persist())

  assert.is(localStorage.getItem('store-key-2'), '222')
  const $store = root.createStore(1, { name: 'store-key-2' })
  $store.watch(watch.fn)

  assert.is($store.getState(), 222)
  assert.is($store.defaultState, 1)

  // call watcher once
  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [222])
})

//
// Launch tests
//

test.run()
