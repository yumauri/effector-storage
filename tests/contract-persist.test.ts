import type { StorageAdapter } from '../src'
import type { Events } from './mocks/events.mock'
import { superstructContract } from '@farfetched/superstruct'
import { createEvent, createStore } from 'effector'
import * as s from 'superstruct'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { persist } from '../src/core'
import { storage } from '../src/storage'
import { createEventsMock } from './mocks/events.mock'
import { createStorageMock } from './mocks/storage.mock'

//
// Mock abstract Storage adapter
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

it('should validate initial storage value with simple contract', () => {
  mockStorage.setItem('number1', '42')
  const $number1 = createStore(0)

  persist({
    adapter: storageAdapter,
    store: $number1,
    key: 'number1',
    contract: (raw): raw is number => typeof raw === 'number',
  })

  expect(mockStorage.getItem('number1')).toBe('42')
  expect($number1.getState()).toBe(42)
})

it('should fail on invalid initial storage value with simple contract', () => {
  const watch = vi.fn()
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

  expect(mockStorage.getItem('number2')).toBe('"invalid"') // didn't change
  expect($number2.getState()).toBe(0) // didn't change

  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0]).toEqual([
    {
      key: 'number2',
      keyPrefix: '',
      operation: 'validate',
      error: ['Invalid data'],
      value: 'invalid',
    },
  ])
})

it('should not break sync stores with same key and different validators', () => {
  const watch = vi.fn()
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
  expect(mockStorage.getItem('same-key-3')).toBe('"plain value"')

  expect($string.getState()).toBe('plain value')
  expect($base64.getState()).toBe('') // <- didn't change

  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0]).toEqual([
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
  expect(mockStorage.getItem('same-key-3')).toBe('"YmFzZTY0IHZhbHVl"')

  expect($string.getState()).toBe('YmFzZTY0IHZhbHVl')
  expect($base64.getState()).toBe('YmFzZTY0IHZhbHVl')
  expect(watch).toHaveBeenCalledTimes(1) // no more errors
})

// TODO: is this correct behavior?
it('validation should not prevent persisting state', () => {
  const watch = vi.fn()
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

  expect(mockStorage.getItem('string1')).toBe('"string value"')
  expect($string1.getState()).toBe('string value')
  expect(watch).toHaveBeenCalledTimes(0) // no errors

  //
  ;($string1 as any).setState(42)
  expect(mockStorage.getItem('string1')).toBe('42')
  expect($string1.getState()).toBe(42)

  // validation error, but state persisted anyway
  // this is because each `set` is followed by `validate` (and then `get`)
  // TODO: is this correct behavior?
  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0]).toEqual([
    {
      key: 'string1',
      keyPrefix: '',
      operation: 'validate',
      error: ['Invalid data'],
      value: 42,
    },
  ])
})

it('should validate initial storage value with complex contract (valid)', () => {
  const watch = vi.fn()
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

  expect($asteroid0.getState()).toEqual({ type: 'asteroid', mass: 42 })
  expect(watch).toHaveBeenCalledTimes(0) // no errors
})

it('should validate initial storage value with complex contract (valid undefined)', () => {
  const watch = vi.fn()
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

  expect(watch).toHaveBeenCalledTimes(0) // no errors, because `undefined` is valid value by contract
})

it('should validate initial storage value with complex contract (invalid)', () => {
  const watch = vi.fn()
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

  expect(mockStorage.getItem('asteroid2')).toBe('42')
  expect($asteroid2.getState()).toBe(null) // <- didn't change

  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0]).toEqual([
    {
      key: 'asteroid2',
      keyPrefix: '',
      operation: 'validate',
      error: ['Expected an object, but received: 42'],
      value: 42,
    },
  ])
})

it('should validate value on storage external update', async () => {
  const watch = vi.fn()
  const fail = createEvent<any>()
  fail.watch(watch)

  const $counter1 = createStore(0, { name: 'counter1' })
  persist({
    store: $counter1,
    adapter: storageAdapter,
    contract: superstructContract(s.number()),
    fail,
  })

  expect($counter1.getState()).toBe(0)

  mockStorage.setItem('counter1', '1')
  await events.dispatchEvent('storage', {
    storageArea: mockStorage,
    key: 'counter1',
    oldValue: null,
    newValue: '1',
  })

  expect($counter1.getState()).toBe(1)
  expect(watch).toHaveBeenCalledTimes(0) // no errors

  mockStorage.setItem('counter1', '"invalid"')
  await events.dispatchEvent('storage', {
    storageArea: mockStorage,
    key: 'counter1',
    oldValue: null,
    newValue: '"invalid"',
  })

  expect($counter1.getState()).toBe(1) // <- didn't change
  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0]).toEqual([
    {
      key: 'counter1',
      keyPrefix: '',
      operation: 'validate',
      error: ['Expected a number, but received: "invalid"'],
      value: 'invalid',
    },
  ])
})
