import type { StorageAdapter } from '../src'
import { test, before, after, mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { createEvent, createStore } from 'effector'
import * as s from 'superstruct'
import { superstructContract } from '@farfetched/superstruct'
import { persist } from '../src/core'
import { storage } from '../src/storage'
import { createStorageMock } from './mocks/storage.mock'
import { type Events, createEventsMock } from './mocks/events.mock'

//
// Mock abstract Storage adapter
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

test('should validate initial storage value with simple contract', () => {
  mockStorage.setItem('number1', '42')
  const $number1 = createStore(0)

  persist({
    adapter: storageAdapter,
    store: $number1,
    key: 'number1',
    contract: (raw): raw is number => typeof raw === 'number',
  })

  assert.strictEqual(mockStorage.getItem('number1'), '42')
  assert.strictEqual($number1.getState(), 42)
})

test('should fail on invalid initial storage value with simple contract', () => {
  const watch = mock.fn()
  const fail = createEvent<any>()
  fail.watch(watch)

  mockStorage.setItem('number2', '"invalid"') // valid JSON, but invalid number
  const $number2 = createStore(0)

  persist({
    adapter: storageAdapter,
    store: $number2,
    key: 'number2',
    contract: (raw): raw is number => typeof raw === 'number',
    fail,
  })

  assert.strictEqual(mockStorage.getItem('number2'), '"invalid"') // didn't change
  assert.strictEqual($number2.getState(), 0) // didn't change

  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [
    {
      key: 'number2',
      keyPrefix: '',
      operation: 'validate',
      error: ['Invalid data'],
      value: 'invalid',
    },
  ])
})

test('should not break sync stores with same key and different validators', () => {
  const watch = mock.fn()
  const fail = createEvent<any>()
  fail.watch(watch)

  const $string = createStore('')
  const $base64 = createStore('')

  persist({
    store: $string,
    adapter: storageAdapter,
    key: 'same-key-3',
    contract: (raw): raw is string => typeof raw === 'string',
    fail,
  })

  persist({
    store: $base64,
    adapter: storageAdapter,
    key: 'same-key-3',
    contract: (raw): raw is string =>
      global.Buffer.from(raw, 'base64').toString('base64') === raw,
    fail,
  })

  //
  ;($string as any).setState('plain value')
  assert.strictEqual(mockStorage.getItem('same-key-3'), '"plain value"')

  assert.strictEqual($string.getState(), 'plain value')
  assert.strictEqual($base64.getState(), '') // <- didn't change

  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [
    {
      key: 'same-key-3',
      keyPrefix: '',
      operation: 'validate',
      error: ['Invalid data'],
      value: 'plain value',
    },
  ])

  //
  ;($string as any).setState('YmFzZTY0IHZhbHVl')
  assert.strictEqual(mockStorage.getItem('same-key-3'), '"YmFzZTY0IHZhbHVl"')

  assert.strictEqual($string.getState(), 'YmFzZTY0IHZhbHVl')
  assert.strictEqual($base64.getState(), 'YmFzZTY0IHZhbHVl')
  assert.strictEqual(watch.mock.callCount(), 1) // no more errors
})

// TODO: is this correct behavior?
test('validation should not prevent persisting state', () => {
  const watch = mock.fn()
  const fail = createEvent<any>()
  fail.watch(watch)

  mockStorage.setItem('string1', '"string value"')
  const $string1 = createStore('')

  persist({
    adapter: storageAdapter,
    store: $string1,
    key: 'string1',
    contract: (raw): raw is string => typeof raw === 'string',
    fail,
  })

  assert.strictEqual(mockStorage.getItem('string1'), '"string value"')
  assert.strictEqual($string1.getState(), 'string value')
  assert.strictEqual(watch.mock.callCount(), 0) // no errors

  //
  ;($string1 as any).setState(42)
  assert.strictEqual(mockStorage.getItem('string1'), '42')
  assert.strictEqual($string1.getState(), 42)

  // validation error, but state persisted anyway
  // this is because each `set` is followed by `validate` (and then `get`)
  // TODO: is this correct behavior?
  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [
    {
      key: 'string1',
      keyPrefix: '',
      operation: 'validate',
      error: ['Invalid data'],
      value: 42,
    },
  ])
})

test('should validate initial storage value with complex contract (valid)', () => {
  const watch = mock.fn()
  const fail = createEvent<any>()
  fail.watch(watch)

  const Asteroid = s.type({
    type: s.literal('asteroid'),
    mass: s.number(),
  })

  mockStorage.setItem('asteroid0', '{"type":"asteroid","mass":42}')
  const $asteroid0 = createStore<null | s.Infer<typeof Asteroid>>(null)

  persist({
    adapter: storageAdapter,
    store: $asteroid0,
    key: 'asteroid0',
    contract: superstructContract(Asteroid),
    fail,
  })

  assert.deepEqual($asteroid0.getState(), { type: 'asteroid', mass: 42 })
  assert.strictEqual(watch.mock.callCount(), 0) // no errors
})

test('should validate initial storage value with complex contract (valid undefined)', () => {
  const watch = mock.fn()
  const fail = createEvent<any>()
  fail.watch(watch)

  const Asteroid = s.type({
    type: s.literal('asteroid'),
    mass: s.number(),
  })

  const $asteroid1 = createStore<null | s.Infer<typeof Asteroid>>(null)

  persist({
    adapter: storageAdapter,
    store: $asteroid1,
    key: 'asteroid1',
    contract: superstructContract(Asteroid),
    fail,
  })

  assert.strictEqual(watch.mock.callCount(), 0) // no errors, because `undefined` is valid value by contract
})

test('should validate initial storage value with complex contract (invalid)', () => {
  const watch = mock.fn()
  const fail = createEvent<any>()
  fail.watch(watch)

  const Asteroid = s.type({
    type: s.literal('asteroid'),
    mass: s.number(),
  })

  mockStorage.setItem('asteroid2', '42')
  const $asteroid2 = createStore<null | s.Infer<typeof Asteroid>>(null)

  persist({
    adapter: storageAdapter,
    store: $asteroid2,
    key: 'asteroid2',
    contract: superstructContract(Asteroid),
    fail,
  })

  assert.strictEqual(mockStorage.getItem('asteroid2'), '42')
  assert.strictEqual($asteroid2.getState(), null) // <- didn't change

  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [
    {
      key: 'asteroid2',
      keyPrefix: '',
      operation: 'validate',
      error: ['Expected an object, but received: 42'],
      value: 42,
    },
  ])
})

test('should validate value on storage external update', async () => {
  const watch = mock.fn()
  const fail = createEvent<any>()
  fail.watch(watch)

  const $counter1 = createStore(0, { name: 'counter1' })
  persist({
    store: $counter1,
    adapter: storageAdapter,
    contract: superstructContract(s.number()),
    fail,
  })

  assert.strictEqual($counter1.getState(), 0)

  mockStorage.setItem('counter1', '1')
  await events.dispatchEvent('storage', {
    storageArea: mockStorage,
    key: 'counter1',
    oldValue: null,
    newValue: '1',
  })

  assert.strictEqual($counter1.getState(), 1)
  assert.strictEqual(watch.mock.callCount(), 0) // no errors

  mockStorage.setItem('counter1', '"invalid"')
  await events.dispatchEvent('storage', {
    storageArea: mockStorage,
    key: 'counter1',
    oldValue: null,
    newValue: '"invalid"',
  })

  assert.strictEqual($counter1.getState(), 1) // <- didn't change
  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [
    {
      key: 'counter1',
      keyPrefix: '',
      operation: 'validate',
      error: ['Expected a number, but received: "invalid"'],
      value: 'invalid',
    },
  ])
})
