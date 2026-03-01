import type { StorageAdapter } from '../src'
import type { Events } from './mocks/events.mock'
import { createEvent, createStore } from 'effector'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { persist } from '../src/core'
import { storage } from '../src/storage'
import { createEventsMock } from './mocks/events.mock'
import { createStorageMock } from './mocks/storage.mock'

//
// Mock abstract Storage and events
//

declare let global: any

const mockStorage = createStorageMock()
let storageAdapter: StorageAdapter
let events: Events

beforeAll(() => {
  events = createEventsMock()
  global.addEventListener = events.addEventListener
  storageAdapter = storage({ storage: () => mockStorage, sync: true })
})

afterAll(() => {
  global.addEventListener = undefined
})

//
// Tests
//

it('persisted store should be updated from storage', async () => {
  const $counter1 = createStore(0, { name: 'counter1' })
  persist({ store: $counter1, adapter: storageAdapter })
  expect($counter1.getState()).toBe(0)

  mockStorage.setItem('counter1', '1')
  await events.dispatchEvent('storage', {
    storageArea: mockStorage,
    key: 'counter1',
    oldValue: null,
    newValue: '1',
  })

  expect($counter1.getState()).toBe(1)
})

it('broken storage value should launch `catch` handler', async () => {
  const handler = createEvent<any>()
  const watch = vi.fn()
  handler.watch(watch)

  const $counter2 = createStore(0, { name: 'counter2' })
  persist({ store: $counter2, adapter: storageAdapter, fail: handler })
  expect($counter2.getState()).toBe(0)

  mockStorage.setItem('counter2', 'broken')
  await events.dispatchEvent('storage', {
    storageArea: mockStorage,
    key: 'counter2',
    oldValue: null,
    newValue: 'broken',
  })

  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0].length).toBe(1)

  const { error, ...args } = watch.mock.calls[0][0]
  expect(args).toEqual({
    key: 'counter2',
    keyPrefix: '',
    operation: 'get',
    value: 'broken',
  })
  expect(error).toBeInstanceOf(SyntaxError)

  expect(mockStorage.getItem('counter2')).toBe('broken')
  expect($counter2.getState()).toBe(0)
})

it('persisted store should ignore updates from different storage', async () => {
  const $counter3 = createStore(0, { name: 'counter3' })
  persist({ store: $counter3, adapter: storageAdapter })
  expect($counter3.getState()).toBe(0)

  await events.dispatchEvent('storage', {
    storageArea: {} as Storage,
    key: 'counter3',
    oldValue: null,
    newValue: '1',
  })

  expect($counter3.getState()).toBe(0)
})

it('persisted store should be erased on storage.clear()', async () => {
  const mockStorage = createStorageMock()
  const storageAdapter = storage({ storage: () => mockStorage, sync: true })

  const $counter4 = createStore(0, { name: 'counter4' })
  persist({ store: $counter4, adapter: storageAdapter })
  expect($counter4.getState()).toBe(0)

  mockStorage.clear()
  await events.dispatchEvent('storage', {
    storageArea: mockStorage,
    key: null,
  })

  expect($counter4.getState()).toBe(null)
})

it('persisted store should be restored to default value on storage.clear()', async () => {
  const mockStorage = createStorageMock()
  mockStorage.setItem('counter5', '42')

  const $counter5 = createStore(0, { name: 'counter5' })
  const adapter = storage({ storage: () => mockStorage, sync: true, def: 21 })
  persist({ store: $counter5, adapter })
  expect($counter5.getState()).toBe(42) // <- restore value from storage

  mockStorage.clear()
  await events.dispatchEvent('storage', {
    storageArea: mockStorage,
    key: null,
  })

  expect($counter5.getState()).toBe(21) // <- default value from adapter
})

it('persisted store should be force updated from storage', async () => {
  const $counter6 = createStore(0, { name: 'counter6' })
  persist({
    store: $counter6,
    adapter: storage({ storage: () => mockStorage, sync: 'force' }),
  })
  expect($counter6.getState()).toBe(0)

  mockStorage.setItem('counter6', '42')
  await events.dispatchEvent('storage', {
    storageArea: mockStorage,
    key: 'counter6',
    oldValue: null,
    newValue: '13', // <- should be ignored as obsolete value and `force` is enabled
  })

  expect($counter6.getState()).toBe(42) // <- should read value from storage
})
