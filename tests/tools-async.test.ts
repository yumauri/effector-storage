import type { StorageAdapter } from '../src'
import { test, before, after, mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { createEvent, createStore } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { type Events, createEventsMock } from './mocks/events.mock'
import { persist, local, async } from '../src'

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

const timeout = (t: number) => new Promise((resolve) => setTimeout(resolve, t))

//
// Tests
//

test('store should be asynchronously initialized from storage value', async () => {
  const $counter1 = createStore(1, { name: 'counter1' })
  global.localStorage.setItem('counter1', '42')

  persist({
    adapter: async(local()),
    store: $counter1,
  })

  assert.strictEqual($counter1.getState(), 1)
  await timeout(0)
  assert.strictEqual($counter1.getState(), 42)
})

test('store should be asynchronously initialized from storage value, using adapter factory', async () => {
  const $counter1 = createStore(1, { name: 'counter11' })
  global.localStorage.setItem('counter11', '54')

  persist({
    adapter: async(local),
    store: $counter1,
  })

  assert.strictEqual($counter1.getState(), 1)
  await timeout(0)
  assert.strictEqual($counter1.getState(), 54)
})

test('store new value should be asynchronously saved to storage', async () => {
  const $counter2 = createStore(0, { name: 'counter2' })

  persist({
    adapter: async(local()),
    store: $counter2,
  })

  //
  ;($counter2 as any).setState(22)
  assert.strictEqual(global.localStorage.getItem('counter2'), null) // <- not saved yet

  await timeout(0)
  assert.strictEqual(global.localStorage.getItem('counter2'), '22') // <- saved
})

test('store new value should be asynchronously saved to storage, using adapter factory', async () => {
  const $counter2 = createStore(0, { name: 'counter22' })

  persist({
    adapter: async(local),
    store: $counter2,
  })

  //
  ;($counter2 as any).setState(222)
  assert.strictEqual(global.localStorage.getItem('counter22'), null) // <- not saved yet

  await timeout(0)
  assert.strictEqual(global.localStorage.getItem('counter22'), '222') // <- saved
})

test('all synchronous operations should be done before `done` event', async () => {
  const watch = mock.fn()

  const done = createEvent<any>()

  global.localStorage.setItem('data', '"changed"')
  const $data = createStore('initial', { name: 'data' })

  persist({
    adapter: async(local()),
    store: $data,
    done,
  })

  // add watcher AFTER persist
  done.watch(watch)
  assert.strictEqual(watch.mock.callCount(), 0)
  assert.strictEqual($data.getState(), 'initial')

  // awaits for next tick
  await timeout(0)
  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [
    {
      key: 'data',
      keyPrefix: '',
      operation: 'get',
      value: 'changed',
    },
  ])
  assert.strictEqual($data.getState(), 'changed')
})

test("should accept adapter's arguments in core persist", async () => {
  const $counter3 = createStore(0, { name: 'counter33' })

  persist({
    adapter: async(local),
    store: $counter3,
    def: 42,
  })

  assert.strictEqual($counter3.getState(), 0) // <- still default 0
  await timeout(0)
  assert.strictEqual($counter3.getState(), 42) // <- restored 42 from default value

  //
  ;($counter3 as any).setState(54)
  assert.strictEqual($counter3.getState(), 54) // <- updated already
  assert.strictEqual(global.localStorage.getItem('counter33'), null) // <- not saved yet

  await timeout(0)
  assert.strictEqual($counter3.getState(), 54) // <- still 54
  assert.strictEqual(global.localStorage.getItem('counter33'), '54') // <- saved

  global.localStorage.removeItem('counter33')
  events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: 'counter33',
    value: null,
  })
  assert.strictEqual($counter3.getState(), 54) // <- old value yet

  await timeout(0)
  assert.strictEqual($counter3.getState(), 42) // <- restored default value from `def`
})

test('should preserve context', async () => {
  const get = mock.fn((_value, _ctx) => undefined as any)
  const set = mock.fn((_value, _ctx) => undefined as any)

  const update = createEvent<number>()
  const pickup = createEvent<string>()
  const $store = createStore(0)

  const adapter: StorageAdapter = (_, upd) => {
    update.watch(upd)
    return {
      get,
      set,
    }
  }

  persist({
    store: $store,
    adapter: async(adapter),
    pickup,
    key: 'store',
  })

  // doesn't call adapter before pickup
  assert.strictEqual(get.mock.callCount(), 0)
  assert.strictEqual(set.mock.callCount(), 0)

  pickup('context payload') // <- pick up new value with context

  // doesn't call adapter yet, because of `async` tool wrapper
  assert.strictEqual(get.mock.callCount(), 0)
  assert.strictEqual(set.mock.callCount(), 0)

  await timeout(0)
  assert.strictEqual(get.mock.callCount(), 1)
  assert.strictEqual(set.mock.callCount(), 0) // <- `set` is not called
  assert.deepEqual(get.mock.calls[0].arguments, [undefined, 'context payload'])

  //
  ;($store as any).setState(42) // <- update store to trigger `set`

  // doesn't call adapter yet, because of `async` tool wrapper
  assert.strictEqual(get.mock.callCount(), 1)
  assert.strictEqual(set.mock.callCount(), 0)

  await timeout(0)
  assert.strictEqual(get.mock.callCount(), 1) // <- `get` is not called
  assert.strictEqual(set.mock.callCount(), 1)
  assert.deepEqual(set.mock.calls[0].arguments, [42, 'context payload'])

  update(54) // <- emulate external adapter update

  // doesn't call adapter yet, because of `async` tool wrapper
  assert.strictEqual(get.mock.callCount(), 1)
  assert.strictEqual(set.mock.callCount(), 1)

  await timeout(0)
  assert.strictEqual(get.mock.callCount(), 2)
  assert.strictEqual(set.mock.callCount(), 1) // <- `set` is not called
  assert.deepEqual(get.mock.calls[1].arguments, [54, 'context payload'])
})
