import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { createEventsMock } from './mocks/events.mock'
import { tie } from '../src'
import { storage } from '../src/storage'

//
// Mock Storage adapter and events
//

declare let global: any

const events = createEventsMock()
global.addEventListener = events.addEventListener

const mockStorage = createStorageMock()
const mockStorageAdapter = storage(mockStorage, true)
const createSyncStorageStore = tie({ with: mockStorageAdapter })(createStore)

//
// Tests
//

test('sync store should be updated from storage', async () => {
  const counter$ = createSyncStorageStore(0, { key: 'counter2' })
  assert.is(mockStorage.getItem('counter2'), '0')
  assert.is(counter$.getState(), JSON.parse(mockStorage.getItem('counter2') as any))

  mockStorage.setItem('counter2', '1')
  await events.dispatchEvent('storage', {
    storageArea: mockStorage,
    key: 'counter2',
    oldValue: '0',
    newValue: '1',
  })

  assert.is(counter$.getState(), 1)
})

test('broken store value should cause .catch() to execute', async () => {
  const handler = snoop(() => undefined)

  const counter$ = createSyncStorageStore(0, { key: 'counter3' }).catch(handler.fn)
  assert.is(mockStorage.getItem('counter3'), '0')
  assert.is(counter$.getState(), JSON.parse(mockStorage.getItem('counter3') as any))

  mockStorage.setItem('counter3', 'broken')
  await events.dispatchEvent('storage', {
    storageArea: mockStorage,
    key: 'counter3',
    oldValue: '0',
    newValue: 'broken',
  })

  assert.is(handler.callCount, 1)
  assert.is(handler.calls[0].arguments.length, 1)
  assert.instance(handler.calls[0].arguments[0 as any], SyntaxError)

  assert.is(mockStorage.getItem('counter3'), 'null')
  assert.is(counter$.getState(), null)
})

test('sync store should ignore updates from different storage', async () => {
  const counter$ = createSyncStorageStore(0, { key: 'counter4' })
  assert.is(counter$.getState(), 0)

  await events.dispatchEvent('storage', {
    storageArea: {} as Storage,
    key: 'counter4',
    oldValue: '0',
    newValue: '1',
  })

  assert.is(counter$.getState(), 0)
})

test('sync store should be erased on storage.clear()', async () => {
  const mockStorage = createStorageMock()
  const mockStorageAdapter = storage(mockStorage, true)
  const createSyncStorageStore = tie({ with: mockStorageAdapter })(createStore)

  const counter$ = createSyncStorageStore(0, { key: 'counter5' })
  assert.is(counter$.getState(), 0)

  mockStorage.clear()
  await events.dispatchEvent('storage', {
    storageArea: mockStorage,
    key: null,
  })

  assert.is(counter$.getState(), null)
})

test.run()
