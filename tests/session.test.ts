import { it, beforeAll, afterAll, vi, expect } from 'vitest'
import { createEvent, createStore } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { type Events, createEventsMock } from './mocks/events.mock'
import { session, persist } from '../src/session'
import { session as sessionIndex } from '../src'

//
// Mock `sessionStorage`
//

declare let global: any
let events: Events

beforeAll(() => {
  global.sessionStorage = createStorageMock()
  events = createEventsMock()
  global.addEventListener = events.addEventListener
})

afterAll(() => {
  global.sessionStorage = undefined
  global.addEventListener = undefined
})

//
// Tests
//

it('should export adapter and `persist` function', () => {
  expect(typeof session === 'function').toBeTruthy()
  expect(typeof persist === 'function').toBeTruthy()
})

it('should be exported from package root', () => {
  expect(session).toBe(sessionIndex)
})

it('should be ok on good parameters', () => {
  const $store = createStore(0, { name: 'session::store' })
  expect(() => persist({ store: $store })).not.toThrow()
})

it('persisted store should reset value on init to default', async () => {
  const $counter00 = createStore(0, { name: 'counter00' })
  persist({ store: $counter00, def: 42 })
  expect($counter00.getState()).toBe(42)
})

it('persisted store should get storage value on init', async () => {
  const $counter01 = createStore(0, { name: 'counter01' })
  global.sessionStorage.setItem('counter01', '1')
  persist({ store: $counter01, def: 42 })
  expect($counter01.getState()).toBe(1)
})

it('persisted store should be restored on key removal', async () => {
  const $counter1 = createStore(0, { name: 'counter1' })
  persist({ store: $counter1, sync: true })
  expect($counter1.getState()).toBe(0)
  ;($counter1 as any).setState(1)
  expect(global.sessionStorage.getItem('counter1')).toBe('1')

  global.sessionStorage.removeItem('counter1')
  await events.dispatchEvent('storage', {
    storageArea: global.sessionStorage,
    key: 'counter1',
    oldValue: '1',
    newValue: null,
  })

  expect($counter1.getState()).toBe(0) // <- store.defaultState
})

it('persisted store should be restored on storage.clear()', async () => {
  const $counter2 = createStore(0, { name: 'counter2' })
  persist({ store: $counter2, sync: true })
  expect($counter2.getState()).toBe(0)
  ;($counter2 as any).setState(2)
  expect(global.sessionStorage.getItem('counter2')).toBe('2')

  global.sessionStorage.clear()
  await events.dispatchEvent('storage', {
    storageArea: global.sessionStorage,
    key: null,
  })

  expect($counter2.getState()).toBe(0) // <- store.defaultState
})

it('persisted store should be restored to default value on storage.clear()', async () => {
  const $counter3 = createStore(0, { name: 'counter3' })
  persist({ store: $counter3, sync: true, def: 42 })
  expect($counter3.getState()).toBe(42)
  ;($counter3 as any).setState(2)
  expect(global.sessionStorage.getItem('counter3')).toBe('2')

  global.sessionStorage.clear()
  await events.dispatchEvent('storage', {
    storageArea: global.sessionStorage,
    key: null,
  })

  expect($counter3.getState()).toBe(42) // <- adapter's default value
})

it('target event should be called with default value on storage.clear()', async () => {
  const watch = vi.fn()

  const source = createEvent<number | null>()
  const target = createEvent<number | null>()
  target.watch(watch)

  persist({ source, target, key: 'counter4', sync: true, def: 42 })

  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0]).toEqual([42])

  source(21)
  expect(watch).toHaveBeenCalledTimes(2)
  expect(watch.mock.calls[1]).toEqual([21])

  global.sessionStorage.clear()
  await events.dispatchEvent('storage', {
    storageArea: global.sessionStorage,
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

  persist({ source, target, key: 'counter5', sync: true })

  expect(watch).toHaveBeenCalledTimes(0) // target is not triggered

  source(21)
  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0]).toEqual([21])

  global.sessionStorage.clear()
  await events.dispatchEvent('storage', {
    storageArea: global.sessionStorage,
    key: null,
  })

  expect(watch).toHaveBeenCalledTimes(2)
  expect(watch.mock.calls[1]).toEqual([null])
})
