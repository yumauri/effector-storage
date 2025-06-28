import type { StorageAdapter } from '../src'
import { test, before, after, mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { createStore, createEvent } from 'effector'
import * as s from 'superstruct'
import { superstructContract } from '@farfetched/superstruct'
import { createStorage, storage, persist } from '../src'
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

test('shoult validate storage value on get', () => {
  const watch = mock.fn()

  mockStorage.setItem('number1', '42')

  const { getFx } = createStorage({
    adapter: storageAdapter,
    key: 'number1',
    contract: (raw): raw is number => typeof raw === 'number',
  })

  getFx.watch(watch)
  getFx.finally.watch(watch)

  getFx()

  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[0].arguments, [undefined]) // getFx trigger
  assert.deepEqual(watch.mock.calls[1].arguments, [
    {
      status: 'done',
      params: undefined,
      result: 42,
    },
  ]) // getFx result

  assert.strictEqual(mockStorage.getItem('number1'), '42')
})

test('shoult fail on invalid initial storage value with simple contract', () => {
  const watch = mock.fn()

  mockStorage.setItem('number2', '"invalid"') // valid JSON, but invalid number

  const { getFx } = createStorage({
    adapter: storageAdapter,
    key: 'number2',
    contract: (raw): raw is number => typeof raw === 'number',
  })

  getFx.watch(watch)
  getFx.finally.watch(watch)

  getFx()

  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[0].arguments, [undefined]) // getFx trigger
  assert.deepEqual(watch.mock.calls[1].arguments, [
    {
      status: 'fail',
      params: undefined,
      error: {
        key: 'number2',
        keyPrefix: '',
        operation: 'validate',
        error: ['Invalid data'],
        value: 'invalid',
      },
    },
  ]) // getFx result

  assert.strictEqual(mockStorage.getItem('number2'), '"invalid"') // didn't change
})

test('should handle sync effects with same key and different validators', () => {
  const watchPlain = mock.fn()
  const watchBase64 = mock.fn()

  const { getFx: getPlainFx, setFx: setPlainFx } = createStorage({
    adapter: storageAdapter,
    key: 'contract-same-key-1',
    contract: (raw): raw is string => typeof raw === 'string',
  })
  const { getFx: getBase64Fx, setFx: setBase64Fx } = createStorage({
    adapter: storageAdapter,
    key: 'contract-same-key-1',
    contract: (raw): raw is string =>
      global.Buffer.from(raw, 'base64').toString('base64') === raw,
  })

  getPlainFx.watch(watchPlain)
  setPlainFx.watch(watchPlain)
  getPlainFx.finally.watch(watchPlain)
  setPlainFx.finally.watch(watchPlain)

  getBase64Fx.watch(watchBase64)
  setBase64Fx.watch(watchBase64)
  getBase64Fx.finally.watch(watchBase64)
  setBase64Fx.finally.watch(watchBase64)

  assert.strictEqual(watchPlain.mock.callCount(), 0)
  assert.strictEqual(watchBase64.mock.callCount(), 0)

  setPlainFx('plain value')
  assert.strictEqual(
    mockStorage.getItem('contract-same-key-1'),
    '"plain value"'
  )

  assert.strictEqual(watchPlain.mock.callCount(), 2)
  assert.deepEqual(watchPlain.mock.calls[0].arguments, ['plain value']) // setPlainFx trigger
  assert.deepEqual(watchPlain.mock.calls[1].arguments, [
    {
      status: 'done',
      params: 'plain value',
      result: undefined,
    },
  ]) // setPlainFx result

  assert.strictEqual(watchBase64.mock.callCount(), 2)
  assert.deepEqual(watchBase64.mock.calls[0].arguments, [undefined]) // getBase64Fx trigger
  assert.deepEqual(watchBase64.mock.calls[1].arguments, [
    {
      status: 'fail',
      params: undefined,
      error: {
        key: 'contract-same-key-1',
        keyPrefix: '',
        operation: 'validate',
        error: ['Invalid data'],
        value: 'plain value',
      },
    },
  ]) // getBase64Fx result

  setBase64Fx('YmFzZTY0IHZhbHVl')
  assert.strictEqual(
    mockStorage.getItem('contract-same-key-1'),
    '"YmFzZTY0IHZhbHVl"'
  )

  assert.strictEqual(watchBase64.mock.callCount(), 4)
  assert.deepEqual(watchBase64.mock.calls[2].arguments, ['YmFzZTY0IHZhbHVl']) // setBase64Fx trigger
  assert.deepEqual(watchBase64.mock.calls[3].arguments, [
    {
      status: 'done',
      params: 'YmFzZTY0IHZhbHVl',
      result: undefined,
    },
  ]) // setBase64Fx result

  assert.strictEqual(watchPlain.mock.callCount(), 4)
  assert.deepEqual(watchPlain.mock.calls[2].arguments, [undefined]) // getPlainFx trigger
  assert.deepEqual(watchPlain.mock.calls[3].arguments, [
    {
      status: 'done',
      params: undefined,
      result: 'YmFzZTY0IHZhbHVl', // this is valid string
    },
  ]) // getPlainFx result
})

test('should handle sync with `persist` with different validators, update from store', () => {
  const watch = mock.fn()
  const $string = createStore('')

  persist({
    store: $string,
    adapter: storageAdapter,
    key: 'contract-same-key-2',
  })

  const { getFx, setFx } = createStorage({
    adapter: storageAdapter,
    key: 'contract-same-key-2',
    contract: (raw): raw is string =>
      global.Buffer.from(raw, 'base64').toString('base64') === raw,
  })

  getFx.watch(watch)
  setFx.watch(watch)
  getFx.finally.watch(watch)
  setFx.finally.watch(watch)

  //
  ;($string as any).setState('plain value')
  assert.strictEqual(
    mockStorage.getItem('contract-same-key-2'),
    '"plain value"'
  )

  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[0].arguments, [undefined]) // getFx trigger
  assert.deepEqual(watch.mock.calls[1].arguments, [
    {
      status: 'fail',
      params: undefined,
      error: {
        key: 'contract-same-key-2',
        keyPrefix: '',
        operation: 'validate',
        error: ['Invalid data'],
        value: 'plain value',
      },
    },
  ]) // getFx result
})

test('should handle sync with `persist` with different validators, update from storage', () => {
  const watch = mock.fn()
  const fail = createEvent<any>()
  fail.watch(watch)

  const $base64 = createStore('')

  persist({
    store: $base64,
    adapter: storageAdapter,
    key: 'contract-same-key-3',
    contract: (raw): raw is string =>
      global.Buffer.from(raw, 'base64').toString('base64') === raw,
    fail,
  })

  const { setFx } = createStorage({
    adapter: storageAdapter,
    key: 'contract-same-key-3',
    contract: (raw): raw is string =>
      global.Buffer.from(raw, 'base64').toString('base64') === raw,
  })

  setFx('plain value')
  assert.strictEqual(
    mockStorage.getItem('contract-same-key-3'),
    '"plain value"'
  )

  assert.strictEqual($base64.getState(), '') // <- didn't change

  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [
    {
      key: 'contract-same-key-3',
      keyPrefix: '',
      operation: 'validate',
      error: ['Invalid data'],
      value: 'plain value',
    },
  ])
})

test('shoult validate storage value on get with complex contract (valid)', () => {
  const watch = mock.fn()

  const Asteroid = s.type({
    type: s.literal('asteroid'),
    mass: s.number(),
  })

  mockStorage.setItem('asteroid0', '{"type":"asteroid","mass":42}')

  const { getFx } = createStorage({
    adapter: storageAdapter,
    key: 'asteroid0',
    contract: superstructContract(Asteroid),
  })

  getFx.watch(watch)
  getFx.finally.watch(watch)

  getFx()

  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[0].arguments, [undefined]) // getFx trigger
  assert.deepEqual(watch.mock.calls[1].arguments, [
    {
      status: 'done',
      params: undefined,
      result: { type: 'asteroid', mass: 42 },
    },
  ]) // getFx result
})

test('shoult validate storage value on get with complex contract (valid undefined)', () => {
  const watch = mock.fn()

  const Asteroid = s.optional(
    s.type({
      type: s.literal('asteroid'),
      mass: s.number(),
    })
  )

  const { getFx } = createStorage({
    adapter: storageAdapter,
    key: 'asteroid1',
    contract: superstructContract(Asteroid),
  })

  getFx.watch(watch)
  getFx.finally.watch(watch)

  getFx()

  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[0].arguments, [undefined]) // getFx trigger
  assert.deepEqual(watch.mock.calls[1].arguments, [
    {
      status: 'done',
      params: undefined,
      result: undefined,
    },
  ]) // getFx result
})

test('shoult validate storage value on get with complex contract (invalid undefined)', () => {
  const watch = mock.fn()

  const Asteroid = s.type({
    type: s.literal('asteroid'),
    mass: s.number(),
  })

  const { getFx } = createStorage({
    adapter: storageAdapter,
    key: 'asteroid1',
    contract: superstructContract(Asteroid),
  })

  getFx.watch(watch)
  getFx.finally.watch(watch)

  getFx()

  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[0].arguments, [undefined]) // getFx trigger
  assert.deepEqual(watch.mock.calls[1].arguments, [
    {
      status: 'fail',
      params: undefined,
      error: {
        key: 'asteroid1',
        keyPrefix: '',
        operation: 'validate',
        error: ['Expected an object, but received: undefined'],
        value: undefined,
      },
    },
  ]) // getFx result
})

test('shoult validate storage value on get with complex contract (invalid)', () => {
  const watch = mock.fn()

  const Asteroid = s.type({
    type: s.literal('asteroid'),
    mass: s.number(),
  })

  mockStorage.setItem('asteroid2', '42')

  const { getFx } = createStorage({
    adapter: storageAdapter,
    key: 'asteroid2',
    contract: superstructContract(Asteroid),
  })

  getFx.watch(watch)
  getFx.finally.watch(watch)

  getFx()

  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[0].arguments, [undefined]) // getFx trigger
  assert.deepEqual(watch.mock.calls[1].arguments, [
    {
      status: 'fail',
      params: undefined,
      error: {
        key: 'asteroid2',
        keyPrefix: '',
        operation: 'validate',
        error: ['Expected an object, but received: 42'],
        value: 42,
      },
    },
  ]) // getFx result

  assert.strictEqual(mockStorage.getItem('asteroid2'), '42')
})

test('should validate value on storage external update', async () => {
  const watch = mock.fn()

  const { getFx } = createStorage({
    adapter: storageAdapter,
    key: 'storage-contract-counter-1',
    contract: superstructContract(s.number()),
  })

  getFx.watch(watch)
  getFx.finally.watch(watch)

  mockStorage.setItem('storage-contract-counter-1', '1')
  await events.dispatchEvent('storage', {
    storageArea: mockStorage,
    key: 'storage-contract-counter-1',
    oldValue: null,
    newValue: '1',
  })

  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[0].arguments, ['1']) // getFx trigger with raw value
  assert.deepEqual(watch.mock.calls[1].arguments, [
    {
      status: 'done',
      params: '1', // raw value from adapter
      result: 1,
    },
  ]) // getFx result

  mockStorage.setItem('storage-contract-counter-1', '"invalid"')
  await events.dispatchEvent('storage', {
    storageArea: mockStorage,
    key: 'storage-contract-counter-1',
    oldValue: null,
    newValue: '"invalid"',
  })

  assert.strictEqual(watch.mock.callCount(), 4)
  assert.deepEqual(watch.mock.calls[2].arguments, ['"invalid"']) // getFx trigger with raw value
  assert.deepEqual(watch.mock.calls[3].arguments, [
    {
      status: 'fail',
      params: '"invalid"', // raw value from adapter
      error: {
        key: 'storage-contract-counter-1',
        keyPrefix: '',
        operation: 'validate',
        error: ['Expected a number, but received: "invalid"'],
        value: 'invalid',
      },
    },
  ]) // getFx result
})
