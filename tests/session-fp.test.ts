import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore, createDomain, is } from 'effector'
import { createStorageMock } from './mocks/storage.mock'

//
// Mock Storage adapter and events
//

declare let global: any

test.before(() => {
  // I'm pretty sure this is the bad hack
  // but I need module to be imported and executed anew
  delete require.cache[require.resolve('../src/session')]

  global.sessionStorage = createStorageMock()
})

test.after(() => {
  delete global.sessionStorage
})

//
// Tests
//

test('should export adapter and `persist` function', async () => {
  const { sessionStorage, persist } = await import('../src/session/fp')
  assert.type(sessionStorage, 'function')
  assert.type(persist, 'function')
})

test('should be ok on good parameters', async () => {
  const { persist } = await import('../src/session/fp')
  const store$ = createStore(0, { name: 'session-fp::store' })
  assert.not.throws(() => persist()(store$))
})

test('should return Store', async () => {
  const { persist } = await import('../src/session/fp')
  const store0$ = createStore(0)
  const store1$ = persist({ key: 'session-fp::store0' })(store0$)
  assert.ok(is.store(store1$))
  assert.ok(store1$ === store0$)
})

test('should be possible to use with .thru()', async () => {
  sessionStorage.setItem('store-key-1', '111')

  const { persist } = await import('../src/session/fp')
  const watch = snoop(() => undefined)

  assert.is(sessionStorage.getItem('store-key-1'), '111')
  const store$ = createStore(1).thru(persist({ key: 'store-key-1' }))
  store$.watch(watch.fn)

  assert.is(store$.getState(), 111)
  assert.is(store$.defaultState, 1)

  // call watcher once
  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [111])
})

test('should be possible to use with domain hook', async () => {
  sessionStorage.setItem('store-key-2', '222')

  const { persist } = await import('../src/session/fp')

  const watch = snoop(() => undefined)
  const root = createDomain()

  root.onCreateStore(persist())

  assert.is(sessionStorage.getItem('store-key-2'), '222')
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
