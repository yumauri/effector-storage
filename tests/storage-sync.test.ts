import type { StorageAdapter } from '../src'
import { test, before, after, mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { createStore, createEvent } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { type Events, createEventsMock } from './mocks/events.mock'
import { persist } from '../src/core'
import { storage } from '../src/storage'

//
// Mock abstract Storage and events
//

declare let global: any

const mockStorage = createStorageMock()
let storageAdapter: StorageAdapter
let events: Events

before(() => {
  events = createEventsMock()
  global.addEventListener = events.addEventListener
  storageAdapter = storage({ storage: () => mockStorage, sync: true })
})

after(() => {
  global.addEventListener = undefined
})

//
// Tests
//

test('persisted store should be updated from storage', async () => {
  const $counter1 = createStore(0, { name: 'counter1' })
  persist({ store: $counter1, adapter: storageAdapter })
  assert.strictEqual($counter1.getState(), 0)

  mockStorage.setItem('counter1', '1')
  await events.dispatchEvent('storage', {
    storageArea: mockStorage,
    key: 'counter1',
    oldValue: null,
    newValue: '1',
  })

  assert.strictEqual($counter1.getState(), 1)
})

test('broken storage value should launch `catch` handler', async () => {
  const handler = createEvent<any>()
  const watch = mock.fn()
  handler.watch(watch)

  const $counter2 = createStore(0, { name: 'counter2' })
  persist({ store: $counter2, adapter: storageAdapter, fail: handler })
  assert.strictEqual($counter2.getState(), 0)

  mockStorage.setItem('counter2', 'broken')
  await events.dispatchEvent('storage', {
    storageArea: mockStorage,
    key: 'counter2',
    oldValue: null,
    newValue: 'broken',
  })

  assert.strictEqual(watch.mock.callCount(), 1)
  assert.strictEqual(watch.mock.calls[0].arguments.length, 1)

  const { error, ...args } = watch.mock.calls[0].arguments[0 as any] as any
  assert.deepEqual(args, {
    key: 'counter2',
    keyPrefix: '',
    operation: 'get',
    value: 'broken',
  })
  assert.ok(error instanceof SyntaxError)

  assert.strictEqual(mockStorage.getItem('counter2'), 'broken')
  assert.strictEqual($counter2.getState(), 0)
})

test('persisted store should ignore updates from different storage', async () => {
  const $counter3 = createStore(0, { name: 'counter3' })
  persist({ store: $counter3, adapter: storageAdapter })
  assert.strictEqual($counter3.getState(), 0)

  await events.dispatchEvent('storage', {
    storageArea: {} as Storage,
    key: 'counter3',
    oldValue: null,
    newValue: '1',
  })

  assert.strictEqual($counter3.getState(), 0)
})

test('persisted store should be erased on storage.clear()', async () => {
  const mockStorage = createStorageMock()
  const storageAdapter = storage({ storage: () => mockStorage, sync: true })

  const $counter4 = createStore(0, { name: 'counter4' })
  persist({ store: $counter4, adapter: storageAdapter })
  assert.strictEqual($counter4.getState(), 0)

  mockStorage.clear()
  await events.dispatchEvent('storage', {
    storageArea: mockStorage,
    key: null,
  })

  assert.strictEqual($counter4.getState(), null)
})

test('persisted store should be restored to default value on storage.clear()', async () => {
  const mockStorage = createStorageMock()
  mockStorage.setItem('counter5', '42')

  const $counter5 = createStore(0, { name: 'counter5' })
  const adapter = storage({ storage: () => mockStorage, sync: true, def: 21 })
  persist({ store: $counter5, adapter })
  assert.strictEqual($counter5.getState(), 42) // <- restore value from storage

  mockStorage.clear()
  await events.dispatchEvent('storage', {
    storageArea: mockStorage,
    key: null,
  })

  assert.strictEqual($counter5.getState(), 21) // <- default value from adapter
})

test('persisted store should be force updated from storage', async () => {
  const $counter6 = createStore(0, { name: 'counter6' })
  persist({
    store: $counter6,
    adapter: storage({ storage: () => mockStorage, sync: 'force' }),
  })
  assert.strictEqual($counter6.getState(), 0)

  mockStorage.setItem('counter6', '42')
  await events.dispatchEvent('storage', {
    storageArea: mockStorage,
    key: 'counter6',
    oldValue: null,
    newValue: '13', // <- should be ignored as obsolete value and `force` is enabled
  })

  assert.strictEqual($counter6.getState(), 42) // <- should read value from storage
})
