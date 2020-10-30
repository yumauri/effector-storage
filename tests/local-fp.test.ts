import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore, createDomain, is } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { createEventsMock } from './mocks/events.mock'

//
// Mock Storage adapter and events
//

declare let global: any
global.window = global.window || {}

const events = global.events || createEventsMock()
global.addEventListener = global.window.addEventListener = events.addEventListener

const localStorageMock = global.window.localStorage || createStorageMock()
global.localStorage = global.window.localStorage = localStorageMock

//
// Tests
//

test('should export adapter and `persist` function', async () => {
  const { localStorage, persist, sink } = await import('../src/local/fp')
  assert.type(localStorage, 'function')
  assert.type(persist, 'function')
  assert.type(sink, 'function')
})

test('should be ok on good parameters', async () => {
  const { persist } = await import('../src/local/fp')
  const store$ = createStore(0, { name: 'local-fp::store' })
  assert.not.throws(() => persist()(store$))
})

test('should return Store', async () => {
  const { persist } = await import('../src/local/fp')
  const store0$ = createStore(0)
  const store1$ = persist({ key: 'local-fp::store0' })(store0$)
  assert.ok(is.store(store1$))
  assert.ok(store1$ === store0$)
})

test('should be possible to use with .thru()', async () => {
  localStorageMock.setItem('store-key-1', '111')

  const { persist } = await import('../src/local/fp')
  const watch = snoop(() => undefined)

  assert.is(global.window.localStorage.getItem('store-key-1'), '111')
  const store$ = createStore(1).thru(persist({ key: 'store-key-1' }))
  store$.watch(watch.fn)

  assert.is(store$.getState(), 111)
  assert.is(store$.defaultState, 1)

  // call watcher once
  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [111])
})

test('should be possible to use with domain hook', async () => {
  localStorageMock.setItem('store-key-2', '222')

  const { persist } = await import('../src/local/fp')

  const watch = snoop(() => undefined)
  const root = createDomain()

  root.onCreateStore(persist())

  assert.is(global.window.localStorage.getItem('store-key-2'), '222')
  const store$ = root.createStore(1, { name: 'store-key-2' })
  store$.watch(watch.fn)

  assert.is(store$.getState(), 222)
  assert.is(store$.defaultState, 1)

  // call watcher once
  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [222])
})

//
// Launch tests
//

test.run()
