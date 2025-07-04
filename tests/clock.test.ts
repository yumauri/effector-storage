import { test } from 'node:test'
import * as assert from 'node:assert/strict'
import { createStore, createEvent } from 'effector'
import { persist } from '../src/core'
import { storage } from '../src/storage'
import { createStorageMock } from './mocks/storage.mock'

//
// Tests
//

test('should set value to storage only on `clock` trigger', () => {
  const mockStorage = createStorageMock()
  mockStorage.setItem('$store', '0')

  const adapter = storage({ storage: () => mockStorage })

  const clock = createEvent()
  const $store = createStore(1, { name: '$store' })
  assert.deepEqual($store.getState(), 1)

  persist({ store: $store, clock, adapter })
  assert.deepEqual($store.getState(), 0) // <- restore from storage

  // change store value
  ;($store as any).setState(1)
  assert.deepEqual(mockStorage.getItem('$store'), '0') // <- didn't changed
  ;($store as any).setState(2)
  assert.deepEqual(mockStorage.getItem('$store'), '0') // <- didn't changed

  clock()
  assert.deepEqual(mockStorage.getItem('$store'), '2') // <- actually set
})
