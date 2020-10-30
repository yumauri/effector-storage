import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore, createEvent } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { createEventsMock } from './mocks/events.mock'
import { StorageAdapter, persist } from '../src'
import { storage } from '../src/storage'

//
// Mock Storage adapter and events
//

declare let global: any

const mockStorage = createStorageMock()
let storageAdapter: StorageAdapter
let events: ReturnType<typeof createEventsMock>

test.before(() => {
  events = createEventsMock()
  global.addEventListener = events.addEventListener
  storageAdapter = storage({ storage: mockStorage, sync: true })
})

test.after(() => {
  delete global.addEventListener
})

// declare let global: any
// global.window = global.window || {}

// const events = global.events || createEventsMock()
// global.addEventListener = global.window.addEventListener = events.addEventListener

//
// Tests
//

test('persisted store should be updated from storage', async () => {
  const $counter1 = createStore(0, { name: 'counter1' })
  persist({ store: $counter1, with: storageAdapter })
  assert.is($counter1.getState(), 0)

  mockStorage.setItem('counter1', '1')
  await events.dispatchEvent('storage', {
    storageArea: mockStorage,
    key: 'counter1',
    oldValue: null,
    newValue: '1',
  })

  assert.is($counter1.getState(), 1)
})

test('broken storage value should launch `catch` handler', async () => {
  const handler = createEvent<any>()
  const watch = snoop(() => undefined)
  handler.watch(watch.fn)

  const $counter2 = createStore(0, { name: 'counter2' })
  persist({ store: $counter2, with: storageAdapter, fail: handler })
  assert.is($counter2.getState(), 0)

  mockStorage.setItem('counter2', 'broken')
  await events.dispatchEvent('storage', {
    storageArea: mockStorage,
    key: 'counter2',
    oldValue: null,
    newValue: 'broken',
  })

  assert.is(watch.callCount, 1)
  assert.is(watch.calls[0].arguments.length, 1)

  const { error, ...args } = watch.calls[0].arguments[0 as any] as any
  assert.equal(args, { key: 'counter2', operation: 'get', value: 'broken' })
  assert.instance(error, SyntaxError)

  assert.is(mockStorage.getItem('counter2'), 'broken')
  assert.is($counter2.getState(), 0)
})

test('persisted store should ignore updates from different storage', async () => {
  const $counter3 = createStore(0, { name: 'counter3' })
  persist({ store: $counter3, with: storageAdapter })
  assert.is($counter3.getState(), 0)

  await events.dispatchEvent('storage', {
    storageArea: {} as Storage,
    key: 'counter3',
    oldValue: null,
    newValue: '1',
  })

  assert.is($counter3.getState(), 0)
})

test('persisted store should be erased on storage.clear()', async () => {
  const mockStorage = createStorageMock()
  const storageAdapter = storage({ storage: mockStorage, sync: true })

  const $counter4 = createStore(0, { name: 'counter4' })
  persist({ store: $counter4, with: storageAdapter })
  assert.is($counter4.getState(), 0)

  mockStorage.clear()
  await events.dispatchEvent('storage', {
    storageArea: mockStorage,
    key: null,
  })

  assert.is($counter4.getState(), null)
})

//
// Launch tests
//

test.run()
