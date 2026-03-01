import type { Events } from './mocks/events.mock'
import { createEvent, createStore } from 'effector'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { local as localIndex } from '../src'
import { local, persist } from '../src/local'
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

//
// Tests
//

it('should export adapter and `persist` function', () => {
  expect(typeof local === 'function').toBeTruthy()
  expect(typeof persist === 'function').toBeTruthy()
})

it('should be exported from package root', () => {
  expect(local).toBe(localIndex)
})

it('should be ok on good parameters', () => {
  const $store = createStore(0, { name: 'local::store' })
  expect(() => persist({ store: $store })).not.toThrow()
})

it('persisted store should reset value on init to default', async () => {
  const $counter00 = createStore(0, { name: 'counter00' })
  persist({ store: $counter00, def: 42 })
  expect($counter00.getState()).toBe(42)
})

it('persisted store should get storage value on init', async () => {
  const $counter01 = createStore(0, { name: 'counter01' })
  global.localStorage.setItem('counter01', '1')
  persist({ store: $counter01, def: 42 })
  expect($counter01.getState()).toBe(1)
})

it('persisted with localStorage store should be synced', async () => {
  const $counter = createStore(0, { name: 'counter' })
  persist({ store: $counter })
  expect($counter.getState()).toBe(0)

  global.localStorage.setItem('counter', '1')
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: 'counter',
    oldValue: null,
    newValue: '1',
  })

  expect($counter.getState()).toBe(1)
})

it('persisted store should be restored on key removal', async () => {
  const $counter1 = createStore(0, { name: 'counter1' })
  persist({ store: $counter1 })
  expect($counter1.getState()).toBe(0)
  ;($counter1 as any).setState(1)
  expect(global.localStorage.getItem('counter1')).toBe('1')

  global.localStorage.removeItem('counter1')
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: 'counter1',
    oldValue: '1',
    newValue: null,
  })

  expect($counter1.getState()).toBe(0) // <- store.defaultState
})

it('persisted store should be restored on storage.clear()', async () => {
  const $counter2 = createStore(0, { name: 'counter2' })
  persist({ store: $counter2 })
  expect($counter2.getState()).toBe(0)
  ;($counter2 as any).setState(2)
  expect(global.localStorage.getItem('counter2')).toBe('2')

  global.localStorage.clear()
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: null,
  })

  expect($counter2.getState()).toBe(0) // <- store.defaultState
})

it('persisted store should be restored to default value on storage.clear()', async () => {
  const $counter3 = createStore(0, { name: 'counter3' })
  persist({ store: $counter3, def: 42 })
  expect($counter3.getState()).toBe(42)
  ;($counter3 as any).setState(2)
  expect(global.localStorage.getItem('counter3')).toBe('2')

  global.localStorage.clear()
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: null,
  })

  expect($counter3.getState()).toBe(42) // <- adapter's default value
})

it('target event should be called with default value on storage.clear()', async () => {
  const watch = vi.fn()

  const source = createEvent<number | null>()
  const target = createEvent<number | null>()
  target.watch(watch)

  persist({ source, target, key: 'counter4', def: 42 })

  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0]).toEqual([42])

  source(21)
  expect(watch).toHaveBeenCalledTimes(2)
  expect(watch.mock.calls[1]).toEqual([21])

  global.localStorage.clear()
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: null,
  })

  expect(watch).toHaveBeenCalledTimes(3)
  expect(watch.mock.calls[2]).toEqual([42])
})

it('target event should be called with null on storage.clear()', async () => {
  const watch = vi.fn()

  const source = createEvent<number | null>()
  const target = createEvent<number | null>()
  target.watch(watch)

  persist({ source, target, key: 'counter5' })

  expect(watch).toHaveBeenCalledTimes(0) // target is not triggered

  source(21)
  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0]).toEqual([21])

  global.localStorage.clear()
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: null,
  })

  expect(watch).toHaveBeenCalledTimes(2)
  expect(watch.mock.calls[1]).toEqual([null])
})
