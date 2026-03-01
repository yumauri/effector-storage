import type { StorageAdapter } from '../src'
import type { Events } from './mocks/events.mock'
import { createEvent, createStore } from 'effector'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { async, local, persist } from '../src'
import { createEventsMock } from './mocks/events.mock'
import { createStorageMock } from './mocks/storage.mock'

//
// Mock `localStorage` and events
//

declare let global: any
let events: Events

beforeAll(() => {
  global.localStorage = createStorageMock()
  events = createEventsMock()
  global.addEventListener = events.addEventListener
})

afterAll(() => {
  global.localStorage = undefined
  global.addEventListener = undefined
})

const timeout = (t: number) => new Promise((resolve) => setTimeout(resolve, t))

//
// Tests
//

it('store should be asynchronously initialized from storage value', async () => {
  const $counter1 = createStore(1, { name: 'counter1' })
  global.localStorage.setItem('counter1', '42')

  persist({
    adapter: async(local()),
    store: $counter1,
  })

  expect($counter1.getState()).toBe(1)
  await timeout(0)
  expect($counter1.getState()).toBe(42)
})

it('store should be asynchronously initialized from storage value, using adapter factory', async () => {
  const $counter1 = createStore(1, { name: 'counter11' })
  global.localStorage.setItem('counter11', '54')

  persist({
    adapter: async(local),
    store: $counter1,
  })

  expect($counter1.getState()).toBe(1)
  await timeout(0)
  expect($counter1.getState()).toBe(54)
})

it('store new value should be asynchronously saved to storage', async () => {
  const $counter2 = createStore(0, { name: 'counter2' })

  persist({
    adapter: async(local()),
    store: $counter2,
  })

  //
  ;($counter2 as any).setState(22)
  expect(global.localStorage.getItem('counter2')).toBe(null) // <- not saved yet

  await timeout(0)
  expect(global.localStorage.getItem('counter2')).toBe('22') // <- saved
})

it('store new value should be asynchronously saved to storage, using adapter factory', async () => {
  const $counter2 = createStore(0, { name: 'counter22' })

  persist({
    adapter: async(local),
    store: $counter2,
  })

  //
  ;($counter2 as any).setState(222)
  expect(global.localStorage.getItem('counter22')).toBe(null) // <- not saved yet

  await timeout(0)
  expect(global.localStorage.getItem('counter22')).toBe('222') // <- saved
})

it('all synchronous operations should be done before `done` event', async () => {
  const watch = vi.fn()

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
  expect(watch).toHaveBeenCalledTimes(0)
  expect($data.getState()).toBe('initial')

  // awaits for next tick
  await timeout(0)
  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0]).toEqual([
    {
      key: 'data',
      keyPrefix: '',
      operation: 'get',
      value: 'changed',
    },
  ])
  expect($data.getState()).toBe('changed')
})

it("should accept adapter's arguments in core persist", async () => {
  const $counter3 = createStore(0, { name: 'counter33' })

  persist({
    adapter: async(local),
    store: $counter3,
    def: 42,
  })

  expect($counter3.getState()).toBe(0) // <- still default 0
  await timeout(0)
  expect($counter3.getState()).toBe(42) // <- restored 42 from default value

  //
  ;($counter3 as any).setState(54)
  expect($counter3.getState()).toBe(54) // <- updated already
  expect(global.localStorage.getItem('counter33')).toBe(null) // <- not saved yet

  await timeout(0)
  expect($counter3.getState()).toBe(54) // <- still 54
  expect(global.localStorage.getItem('counter33')).toBe('54') // <- saved

  global.localStorage.removeItem('counter33')
  events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: 'counter33',
    value: null,
  })
  expect($counter3.getState()).toBe(54) // <- old value yet

  await timeout(0)
  expect($counter3.getState()).toBe(42) // <- restored default value from `def`
})

it('should preserve context', async () => {
  const get = vi.fn((_value, _ctx) => undefined as any)
  const set = vi.fn((_value, _ctx) => undefined as any)

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
  expect(get).toHaveBeenCalledTimes(0)
  expect(set).toHaveBeenCalledTimes(0)

  pickup('context payload') // <- pick up new value with context

  // doesn't call adapter yet, because of `async` tool wrapper
  expect(get).toHaveBeenCalledTimes(0)
  expect(set).toHaveBeenCalledTimes(0)

  await timeout(0)
  expect(get).toHaveBeenCalledTimes(1)
  expect(set).toHaveBeenCalledTimes(0) // <- `set` is not called
  expect(get.mock.calls[0]).toEqual([undefined, 'context payload'])

  //
  ;($store as any).setState(42) // <- update store to trigger `set`

  // doesn't call adapter yet, because of `async` tool wrapper
  expect(get).toHaveBeenCalledTimes(1)
  expect(set).toHaveBeenCalledTimes(0)

  await timeout(0)
  expect(get).toHaveBeenCalledTimes(1) // <- `get` is not called
  expect(set).toHaveBeenCalledTimes(1)
  expect(set.mock.calls[0]).toEqual([42, 'context payload'])

  update(54) // <- emulate external adapter update

  // doesn't call adapter yet, because of `async` tool wrapper
  expect(get).toHaveBeenCalledTimes(1)
  expect(set).toHaveBeenCalledTimes(1)

  await timeout(0)
  expect(get).toHaveBeenCalledTimes(2)
  expect(set).toHaveBeenCalledTimes(1) // <- `set` is not called
  expect(get.mock.calls[1]).toEqual([54, 'context payload'])
})
