import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createEvent, createStore } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { createEventsMock } from './mocks/events.mock'
import { local, persist } from '../src/local'

//
// Mock `localStorage` and events
//

declare let global: any
let events: ReturnType<typeof createEventsMock>

test.before(() => {
  global.localStorage = createStorageMock()
  events = createEventsMock()
  global.addEventListener = events.addEventListener
})

test.after(() => {
  delete global.localStorage
  delete global.addEventListener
})

//
// Tests
//

test('should export adapter and `persist` function', () => {
  assert.type(local, 'function')
  assert.type(persist, 'function')
})

test('should be ok on good parameters', () => {
  const $store = createStore(0, { name: 'local::store' })
  assert.not.throws(() => persist({ store: $store }))
})

test('persisted store shoult reset value on init to default', async () => {
  const $counter00 = createStore(0, { name: 'counter00' })
  persist({ store: $counter00, def: 42 })
  assert.is($counter00.getState(), 42)
})

test('persisted store should get storage value on init', async () => {
  const $counter01 = createStore(0, { name: 'counter01' })
  global.localStorage.setItem('counter01', '1')
  persist({ store: $counter01, def: 42 })
  assert.is($counter01.getState(), 1)
})

test('persisted with localStorage store should be synced', async () => {
  const $counter = createStore(0, { name: 'counter' })
  persist({ store: $counter })
  assert.is($counter.getState(), 0)

  global.localStorage.setItem('counter', '1')
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: 'counter',
    oldValue: null,
    newValue: '1',
  })

  assert.is($counter.getState(), 1)
})

test('persisted store should be restored on key removal', async () => {
  const $counter1 = createStore(0, { name: 'counter1' })
  persist({ store: $counter1 })
  assert.is($counter1.getState(), 0)
  ;($counter1 as any).setState(1)
  assert.is(global.localStorage.getItem('counter1'), '1')

  global.localStorage.removeItem('counter1')
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: 'counter1',
    oldValue: '1',
    newValue: null,
  })

  assert.is($counter1.getState(), 0) // <- store.defaultState
})

test('persisted store should be restored on storage.clear()', async () => {
  const $counter2 = createStore(0, { name: 'counter2' })
  persist({ store: $counter2 })
  assert.is($counter2.getState(), 0)
  ;($counter2 as any).setState(2)
  assert.is(global.localStorage.getItem('counter2'), '2')

  global.localStorage.clear()
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: null,
  })

  assert.is($counter2.getState(), 0) // <- store.defaultState
})

test('persisted store should be restored to default value on storage.clear()', async () => {
  const $counter3 = createStore(0, { name: 'counter3' })
  persist({ store: $counter3, def: 42 })
  assert.is($counter3.getState(), 42)
  ;($counter3 as any).setState(2)
  assert.is(global.localStorage.getItem('counter3'), '2')

  global.localStorage.clear()
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: null,
  })

  assert.is($counter3.getState(), 42) // <- adapter's default value
})

test('target event should be called with default value on storage.clear()', async () => {
  const watch = snoop(() => undefined)

  const source = createEvent<number | null>()
  const target = createEvent<number | null>()
  target.watch(watch.fn)

  persist({ source, target, key: 'counter4', def: 42 })

  // FIXME: target called 2 times because `forward` doesn't batch updates
  // first:  getFx.done -> target
  // second: getFx.done -> storage area -> target
  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[0].arguments, [42])
  assert.equal(watch.calls[1].arguments, [42])

  source(21)
  assert.is(watch.callCount, 3)
  assert.equal(watch.calls[2].arguments, [21])

  global.localStorage.clear()
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: null,
  })

  // FIXME: target called 2 times because `forward` doesn't batch updates
  // first:  getFx.done -> target
  // second: getFx.done -> storage area -> target
  assert.is(watch.callCount, 5)
  assert.equal(watch.calls[3].arguments, [42])
  assert.equal(watch.calls[4].arguments, [42])
})

test('target event should be called with null on storage.clear()', async () => {
  const watch = snoop(() => undefined)

  const source = createEvent<number | null>()
  const target = createEvent<number | null>()
  target.watch(watch.fn)

  persist({ source, target, key: 'counter5' })

  // FIXME: target called 1, but with `undefined`
  // this may be appropriate for stores, but not for events
  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [undefined])

  source(21)
  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[1].arguments, [21])

  global.localStorage.clear()
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: null,
  })

  // FIXME: target called 2 times because `forward` doesn't batch updates
  // first:  getFx.done -> target
  // second: getFx.done -> storage area -> target
  assert.is(watch.callCount, 4)
  assert.equal(watch.calls[2].arguments, [null])
  assert.equal(watch.calls[3].arguments, [null])
})

//
// Launch tests
//

test.run()
