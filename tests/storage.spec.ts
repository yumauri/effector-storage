import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore, createEvent } from 'effector'
import { tie } from '../src'
import { storage } from '../src/storage'
import { createStorageMock } from './mocks/storage.mock'

//
// Mock Storage adapter
//

const mockStorage = createStorageMock()
const mockStorageAdapter = storage(mockStorage, false)
const withStorage = tie({ with: mockStorageAdapter })
const createStorageStore = withStorage(createStore)

//
// Tests
//

test('store initial value should be saved to storage', () => {
  const counter$ = createStorageStore(0, { key: 'counter3' })
  assert.is(mockStorage.getItem('counter3'), '0')
  assert.is(counter$.getState(), JSON.parse(mockStorage.getItem('counter3') as any))
})

test('store new value should be saved to storage', () => {
  const counter$ = createStorageStore(0, { key: 'counter4' })
  assert.is(mockStorage.getItem('counter4'), '0')
  assert.is(counter$.getState(), JSON.parse(mockStorage.getItem('counter4') as any))
  ;(counter$ as any).setState(3)
  assert.is(mockStorage.getItem('counter4'), '3')
  assert.is(counter$.getState(), JSON.parse(mockStorage.getItem('counter4') as any))
})

test('store should be initialized from storage value', () => {
  mockStorage.setItem('counter5', '42')
  const counter$ = createStorageStore(0, { key: 'counter5' })
  assert.is(mockStorage.getItem('counter5'), '42')
  assert.is(counter$.getState(), 42)
})

test('reset store should reset it to given initial value', () => {
  mockStorage.setItem('counter6', '42')
  const reset = createEvent()
  const counter$ = createStorageStore(0, { key: 'counter6' }).reset(reset)
  assert.is(mockStorage.getItem('counter6'), '42')
  assert.is(counter$.getState(), 42)
  reset()
  assert.is(mockStorage.getItem('counter6'), '0')
  assert.is(counter$.getState(), 0)
})

test('broken storage value should be ignored', () => {
  mockStorage.setItem('counter7', 'broken')
  const counter$ = createStorageStore(13, { key: 'counter7' })
  assert.is(mockStorage.getItem('counter7'), '13')
  assert.is(counter$.getState(), 13)
})

// FIXME: this test expected to be failing
test.skip('broken storage value should cause .catch() to execute', () => {
  const handler = snoop(() => undefined)

  mockStorage.setItem('counter8', 'broken')
  const counter$ = createStorageStore(13, { key: 'counter8' }).catch(handler.fn)

  assert.is(handler.callCount, 1)
  assert.is(handler.calls[0].arguments.length, 1)
  assert.instance(handler.calls[0].arguments[0 as any], SyntaxError)

  assert.is(mockStorage.getItem('counter8'), '13')
  assert.is(counter$.getState(), 13)
})

test('should not fail if error handler is absent', () => {
  const store$ = createStorageStore({ test: 1 }, { key: 'store0' })
  assert.is(mockStorage.getItem('store0'), '{"test":1}')
  assert.equal(store$.getState(), { test: 1 })

  const recursive = {}
  ;(recursive as any).recursive = recursive
  ;(store$ as any).setState(recursive)

  assert.is(mockStorage.getItem('store0'), '{"test":1}')
  assert.is(store$.getState(), recursive)
})

test('broken store value should cause .catch() to execute', () => {
  const handler = snoop(() => undefined)

  const store$ = createStorageStore({ test: 1 }, { key: 'store' }).catch(handler.fn)

  assert.is(mockStorage.getItem('store'), '{"test":1}')
  assert.equal(store$.getState(), { test: 1 })

  const recursive = {}
  ;(recursive as any).recursive = recursive
  ;(store$ as any).setState(recursive)

  assert.is(handler.callCount, 1)
  assert.is(handler.calls[0].arguments.length, 1)
  assert.instance(handler.calls[0].arguments[0 as any], TypeError)

  assert.is(mockStorage.getItem('store'), '{"test":1}')
  assert.is(store$.getState(), recursive)
})

test('custom storage instance should not interfere with global', () => {
  const mockStorage2 = createStorageMock()
  const mockStorage2Adapter = storage(mockStorage2, false)
  const withStorage2 = tie({ with: mockStorage2Adapter })
  const createStorage2Store = withStorage2(createStore)

  mockStorage.setItem('custom', '111')
  mockStorage2.setItem('custom', '222')

  const counter$ = createStorage2Store(0, { key: 'custom' })

  assert.is(mockStorage.getItem('custom'), '111')
  assert.is(mockStorage2.getItem('custom'), '222')
  assert.is(counter$.getState(), 222)
  ;(counter$ as any).setState(333)
  assert.is(mockStorage.getItem('custom'), '111')
  assert.is(mockStorage2.getItem('custom'), '333')
  assert.is(counter$.getState(), JSON.parse(mockStorage2.getItem('custom') as any))
})

test.run()
