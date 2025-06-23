import { test, mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { createStore, createEvent } from 'effector'
import { persist } from '../src/core'
import { storage } from '../src/storage'
import { createStorageMock } from './mocks/storage.mock'

//
// Tests
//

test('should NOT pickup new initial value', () => {
  const watch = mock.fn()

  const mockStorage = createStorageMock()
  mockStorage.setItem('$store', '0')

  const adapter = storage({ storage: () => mockStorage })

  const pickup = createEvent()
  const $store = createStore(1, { name: '$store' })
  $store.watch(watch)

  assert.strictEqual($store.getState(), 1)
  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [1])

  persist({ store: $store, adapter, pickup })

  assert.strictEqual($store.getState(), 1) // <- original store value
  assert.strictEqual(watch.mock.callCount(), 1)
})

test('should pickup new value on event', () => {
  const watch = mock.fn()

  const mockStorage = createStorageMock()
  mockStorage.setItem('$store', '42')

  const adapter = storage({ storage: () => mockStorage })

  const pickup = createEvent()
  const $store = createStore(1, { name: '$store' })
  $store.watch(watch)

  assert.strictEqual($store.getState(), 1)
  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [1])

  persist({ store: $store, adapter, pickup })
  pickup() // <- pick up new value

  assert.strictEqual($store.getState(), 42)
  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[1].arguments, [42])
})
