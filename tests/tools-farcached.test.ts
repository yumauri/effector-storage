import { test, before, beforeEach, after, mock } from 'node:test'
import * as assert from 'node:assert/strict'
import {
  createEvent,
  createEffect,
  createStore,
  fork,
  sample,
  allSettled,
} from 'effector'
import {
  localStorageCache,
  sessionStorageCache,
  inMemoryCache,
} from '@farfetched/core'
import { createStorageMock } from './mocks/storage.mock'
import { type Events, createEventsMock } from './mocks/events.mock'
import { persist, farcached } from '../src'

//
// Mock `localStorage`, `sessionStorage`, events and system clock
//

const NOW = 1_000_000_000_000 // 2001-09-09T01:46:40.000Z

declare let global: any
let events: Events

before(() => {
  mock.timers.enable()
  global.localStorage = createStorageMock()
  global.sessionStorage = createStorageMock()
  events = createEventsMock()
  global.addEventListener = events.addEventListener
})

beforeEach(() => {
  mock.timers.setTime(NOW)
})

after(() => {
  global.addEventListener = undefined
  global.sessionStorage = undefined
  global.localStorage = undefined
  mock.timers.reset()
})

//
// Tests
//

test('store should be initialized from storage value', async () => {
  const $counter1 = createStore(1, { name: 'counter1' })
  global.localStorage.setItem(
    'counter1',
    JSON.stringify({ value: 42, timestamp: NOW - 1000 }) // like saved 1 second ago
  )

  persist({
    store: $counter1,
    adapter: farcached(localStorageCache()),
  })

  for (let i = 0; i < 100; i++) await Promise.resolve() // dunno how to do it nicely ._.

  assert.strictEqual($counter1.getState(), 42)
})

test('store new value should be saved to storage', async () => {
  const $counter2 = createStore(0, { name: 'counter2' })
  persist({
    store: $counter2,
    adapter: farcached(localStorageCache()),
  })

  //
  ;($counter2 as any).setState(22)

  for (let i = 0; i < 100; i++) await Promise.resolve() // dunno how to do it nicely ._.

  assert.strictEqual(
    global.localStorage.getItem('counter2'),
    `{"value":22,"timestamp":${NOW}}`
  )
})

test('should invalidate cache (built-in farfetched feature) right away', async () => {
  const $counter3 = createStore(1, { name: 'counter3' })
  global.localStorage.setItem(
    'counter3',
    JSON.stringify({ value: 31, timestamp: NOW - 20 * 60 * 1000 }) // like saved 20 minutes ago
  )

  persist({
    store: $counter3,
    adapter: farcached(localStorageCache({ maxAge: '15m' })),
  })

  for (let i = 0; i < 100; i++) await Promise.resolve() // dunno how to do it nicely ._.

  assert.strictEqual($counter3.getState(), 1) // should not be restored
  assert.strictEqual(global.localStorage.getItem('counter3'), null) // should erase
})

test('should be possible to inject different cache adapter (no initial value)', async () => {
  const $counter4 = createStore(1, { name: 'counter4' })

  const pickup = createEvent<[number, number]>()
  const cache = localStorageCache()
  persist({
    store: $counter4,
    adapter: farcached(cache),
    pickup,
  })

  const updateFx = createEffect<[number, number], number>(
    ([value, timeout]) =>
      new Promise((resolve) => {
        setTimeout(() => resolve(value), timeout)
      })
  )

  sample({ clock: pickup, target: updateFx })
  sample({ clock: updateFx.doneData, target: $counter4 })

  const scopeA = fork()
  const scopeB = fork({ values: [[cache.__.$instance, sessionStorageCache()]] })

  const waitSettled = Promise.all([
    allSettled(pickup, { scope: scopeA, params: [2, 1000] }),
    allSettled(pickup, { scope: scopeB, params: [3, 2000] }),
  ])

  mock.timers.tick(1000)
  for (let i = 0; i < 100; i++) await Promise.resolve() // dunno how to do it nicely ._.

  mock.timers.tick(1000)
  for (let i = 0; i < 100; i++) await Promise.resolve() // dunno how to do it nicely ._.

  await waitSettled // wait for both allSettled to finish

  // store values in different scopes should be different
  assert.strictEqual($counter4.getState(), 1)
  assert.strictEqual(scopeA.getState($counter4), 2)
  assert.strictEqual(scopeB.getState($counter4), 3)

  // localStorage should contain value from scopeA
  assert.strictEqual(
    global.localStorage.getItem('counter4'),
    '{"value":2,"timestamp":1000000001000}' // timestamp is 1000
  )

  // sessionStorage should contain value from scopeB
  assert.strictEqual(
    global.sessionStorage.getItem('counter4'),
    '{"value":3,"timestamp":1000000002000}' // timestamp is 2000
  )
})

test('should be possible to inject different cache adapter (with initial value)', async () => {
  const $counter5 = createStore(1, { name: 'counter5' })

  global.localStorage.setItem(
    'counter5',
    JSON.stringify({ value: 2, timestamp: NOW - 1000 }) // like saved 1 second ago
  )
  global.sessionStorage.setItem(
    'counter5',
    JSON.stringify({ value: 3, timestamp: NOW - 2000 }) // like saved 2 seconds ago
  )

  const pickup = createEvent()
  const cache = inMemoryCache() // memory adapter by default
  persist({
    store: $counter5,
    adapter: farcached(cache),
    pickup,
  })

  const scopeA = fork({ values: [[cache.__.$instance, localStorageCache()]] })
  const scopeB = fork({ values: [[cache.__.$instance, sessionStorageCache()]] })

  const waitSettled = Promise.all([
    allSettled(pickup, { scope: scopeA }),
    allSettled(pickup, { scope: scopeB }),
  ])
  mock.timers.runAll()
  await waitSettled // wait for both allSettled to finish

  // store values in different scopes should be restored to different values
  assert.strictEqual($counter5.getState(), 1)
  assert.strictEqual(scopeA.getState($counter5), 2)
  assert.strictEqual(scopeB.getState($counter5), 3)
})

// FIXME: don't know how to fix this behavior without specifying `keyArea`...
test('should NOT sync stores without defining `keyArea`', async () => {
  const $store0 = createStore(1)
  const $store1 = createStore(2)

  assert.strictEqual($store0.getState(), 1)
  assert.strictEqual($store1.getState(), 2)

  persist({
    store: $store0,
    adapter: farcached(localStorageCache()),
    key: 'same-key-01',
  })
  persist({
    store: $store1,
    adapter: farcached(localStorageCache()),
    key: 'same-key-01',
  })

  //
  ;($store0 as any).setState(3)

  for (let i = 0; i < 100; i++) await Promise.resolve() // dunno how to do it nicely ._.

  assert.strictEqual($store0.getState(), 3)
  assert.strictEqual($store1.getState(), 2) // <- did not change
})

test('should sync stores with same `keyArea`', async () => {
  const $store2 = createStore(1)
  const $store3 = createStore(2)

  assert.strictEqual($store2.getState(), 1)
  assert.strictEqual($store3.getState(), 2)

  persist({
    store: $store2,
    adapter: farcached(localStorageCache(), 'farcached-local'),
    key: 'same-key-23',
  })
  persist({
    store: $store3,
    adapter: farcached(localStorageCache(), 'farcached-local'),
    key: 'same-key-23',
  })

  //
  ;($store2 as any).setState(3)

  for (let i = 0; i < 100; i++) await Promise.resolve() // dunno how to do it nicely ._.

  assert.strictEqual($store2.getState(), 3)
  assert.strictEqual($store3.getState(), 3) // <- also changed
})
