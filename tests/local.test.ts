import { test, before, after, mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { createEvent, createStore } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { type Events, createEventsMock } from './mocks/events.mock'
import { local, persist, createStorage } from '../src/local'
import { local as localIndex } from '../src'

//
// Mock `localStorage` and events
//

declare let global: any
let events: Events

before(() => {
  global.localStorage = createStorageMock()
  events = createEventsMock()
  global.addEventListener = events.addEventListener
})

after(() => {
  global.localStorage = undefined
  global.addEventListener = undefined
})

//
// Tests
//

test('should export adapter and `persist` function', () => {
  assert.ok(typeof local === 'function')
  assert.ok(typeof persist === 'function')
  assert.ok(typeof createStorage === 'function')
})

test('should be exported from package root', () => {
  assert.strictEqual(local, localIndex)
})

test('should be ok on good parameters', () => {
  const $store = createStore(0, { name: 'local::store' })
  assert.doesNotThrow(() => persist({ store: $store }))
  assert.doesNotThrow(() => createStorage('local::store'))
  assert.doesNotThrow(() => createStorage({ key: 'local::store' }))
})

test('persisted store should reset value on init to default', async () => {
  const $counter00 = createStore(0, { name: 'counter00' })
  persist({ store: $counter00, def: 42 })
  assert.strictEqual($counter00.getState(), 42)
})

test('persisted store should get storage value on init', async () => {
  const $counter01 = createStore(0, { name: 'counter01' })
  global.localStorage.setItem('counter01', '1')
  persist({ store: $counter01, def: 42 })
  assert.strictEqual($counter01.getState(), 1)
})

test('persisted with localStorage store should be synced', async () => {
  const $counter = createStore(0, { name: 'counter' })
  persist({ store: $counter })
  assert.strictEqual($counter.getState(), 0)

  global.localStorage.setItem('counter', '1')
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: 'counter',
    oldValue: null,
    newValue: '1',
  })

  assert.strictEqual($counter.getState(), 1)
})

test('persisted store should be restored on key removal', async () => {
  const $counter1 = createStore(0, { name: 'counter1' })
  persist({ store: $counter1 })
  assert.strictEqual($counter1.getState(), 0)
  ;($counter1 as any).setState(1)
  assert.strictEqual(global.localStorage.getItem('counter1'), '1')

  global.localStorage.removeItem('counter1')
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: 'counter1',
    oldValue: '1',
    newValue: null,
  })

  assert.strictEqual($counter1.getState(), 0) // <- store.defaultState
})

test('persisted store should be restored on storage.clear()', async () => {
  const $counter2 = createStore(0, { name: 'counter2' })
  persist({ store: $counter2 })
  assert.strictEqual($counter2.getState(), 0)
  ;($counter2 as any).setState(2)
  assert.strictEqual(global.localStorage.getItem('counter2'), '2')

  global.localStorage.clear()
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: null,
  })

  assert.strictEqual($counter2.getState(), 0) // <- store.defaultState
})

test('persisted store should be restored to default value on storage.clear()', async () => {
  const $counter3 = createStore(0, { name: 'counter3' })
  persist({ store: $counter3, def: 42 })
  assert.strictEqual($counter3.getState(), 42)
  ;($counter3 as any).setState(2)
  assert.strictEqual(global.localStorage.getItem('counter3'), '2')

  global.localStorage.clear()
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: null,
  })

  assert.strictEqual($counter3.getState(), 42) // <- adapter's default value
})

test('target event should be called with default value on storage.clear()', async () => {
  const watch = mock.fn()

  const source = createEvent<number | null>()
  const target = createEvent<number | null>()
  target.watch(watch)

  persist({ source, target, key: 'counter4', def: 42 })

  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [42])

  source(21)
  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[1].arguments, [21])

  global.localStorage.clear()
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: null,
  })

  assert.strictEqual(watch.mock.callCount(), 3)
  assert.deepEqual(watch.mock.calls[2].arguments, [42])
})

test('target event should be called with null on storage.clear()', async () => {
  const watch = mock.fn()

  const source = createEvent<number | null>()
  const target = createEvent<number | null>()
  target.watch(watch)

  persist({ source, target, key: 'counter5' })

  assert.strictEqual(watch.mock.callCount(), 0) // target is not triggered

  source(21)
  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [21])

  global.localStorage.clear()
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: null,
  })

  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[1].arguments, [null])
})
