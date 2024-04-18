import type { StorageAdapter } from '../src'
import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore, createEvent } from 'effector'
import { Record, Literal, Number, Optional } from 'runtypes'
import { runtypeContract } from '@farfetched/runtypes'
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

test.before(() => {
  events = createEventsMock()
  global.addEventListener = events.addEventListener
  storageAdapter = storage({ storage: () => mockStorage, sync: true })
})

test.after(() => {
  delete global.addEventListener
})

//
// Tests
//

test('shoult validate storage value on get', () => {
  const watch = snoop(() => undefined)

  mockStorage.setItem('number1', '42')

  const { get: getFx } = createStorage({
    adapter: storageAdapter,
    key: 'number1',
    contract: (raw): raw is number => typeof raw === 'number',
  })

  getFx.watch(watch.fn)
  getFx.finally.watch(watch.fn)

  getFx()

  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[0].arguments, [undefined]) // getFx trigger
  assert.equal(watch.calls[1].arguments, [
    {
      status: 'done',
      params: undefined,
      result: 42,
    },
  ]) // getFx result

  assert.is(mockStorage.getItem('number1'), '42')
})

test('shoult fail on invalid initial storage value with simple contract', () => {
  const watch = snoop(() => undefined)

  mockStorage.setItem('number2', '"invalid"') // valid JSON, but invalid number

  const { get: getFx } = createStorage({
    adapter: storageAdapter,
    key: 'number2',
    contract: (raw): raw is number => typeof raw === 'number',
  })

  getFx.watch(watch.fn)
  getFx.finally.watch(watch.fn)

  getFx()

  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[0].arguments, [undefined]) // getFx trigger
  assert.equal(watch.calls[1].arguments, [
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

  assert.is(mockStorage.getItem('number2'), '"invalid"') // didn't change
})

test('should handle sync effects with same key and different validators', () => {
  const watchPlain = snoop(() => undefined)
  const watchBase64 = snoop(() => undefined)

  const { get: getPlainFx, set: setPlainFx } = createStorage({
    adapter: storageAdapter,
    key: 'contract-same-key-1',
    contract: (raw): raw is string => typeof raw === 'string',
  })
  const { get: getBase64Fx, set: setBase64Fx } = createStorage({
    adapter: storageAdapter,
    key: 'contract-same-key-1',
    contract: (raw): raw is string =>
      global.Buffer.from(raw, 'base64').toString('base64') === raw,
  })

  getPlainFx.watch(watchPlain.fn)
  setPlainFx.watch(watchPlain.fn)
  getPlainFx.finally.watch(watchPlain.fn)
  setPlainFx.finally.watch(watchPlain.fn)

  getBase64Fx.watch(watchBase64.fn)
  setBase64Fx.watch(watchBase64.fn)
  getBase64Fx.finally.watch(watchBase64.fn)
  setBase64Fx.finally.watch(watchBase64.fn)

  assert.is(watchPlain.callCount, 0)
  assert.is(watchBase64.callCount, 0)

  setPlainFx('plain value')
  assert.is(mockStorage.getItem('contract-same-key-1'), '"plain value"')

  assert.is(watchPlain.callCount, 2)
  assert.equal(watchPlain.calls[0].arguments, ['plain value']) // setPlainFx trigger
  assert.equal(watchPlain.calls[1].arguments, [
    {
      status: 'done',
      params: 'plain value',
      result: undefined,
    },
  ]) // setPlainFx result

  assert.is(watchBase64.callCount, 2)
  assert.equal(watchBase64.calls[0].arguments, [undefined]) // getBase64Fx trigger
  assert.equal(watchBase64.calls[1].arguments, [
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
  assert.is(mockStorage.getItem('contract-same-key-1'), '"YmFzZTY0IHZhbHVl"')

  assert.is(watchBase64.callCount, 4)
  assert.equal(watchBase64.calls[2].arguments, ['YmFzZTY0IHZhbHVl']) // setBase64Fx trigger
  assert.equal(watchBase64.calls[3].arguments, [
    {
      status: 'done',
      params: 'YmFzZTY0IHZhbHVl',
      result: undefined,
    },
  ]) // setBase64Fx result

  assert.is(watchPlain.callCount, 4)
  assert.equal(watchPlain.calls[2].arguments, [undefined]) // getPlainFx trigger
  assert.equal(watchPlain.calls[3].arguments, [
    {
      status: 'done',
      params: undefined,
      result: 'YmFzZTY0IHZhbHVl', // this is valid string
    },
  ]) // getPlainFx result
})

test('should handle sync with `persist` with different validators, update from store', () => {
  const watch = snoop(() => undefined)
  const $string = createStore('')

  persist({
    store: $string,
    adapter: storageAdapter,
    key: 'contract-same-key-2',
  })

  const { get: getFx, set: setFx } = createStorage({
    adapter: storageAdapter,
    key: 'contract-same-key-2',
    contract: (raw): raw is string =>
      global.Buffer.from(raw, 'base64').toString('base64') === raw,
  })

  getFx.watch(watch.fn)
  setFx.watch(watch.fn)
  getFx.finally.watch(watch.fn)
  setFx.finally.watch(watch.fn)

  //
  ;($string as any).setState('plain value')
  assert.is(mockStorage.getItem('contract-same-key-2'), '"plain value"')

  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[0].arguments, [undefined]) // getFx trigger
  assert.equal(watch.calls[1].arguments, [
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
  const watch = snoop(() => undefined)
  const fail = createEvent<any>()
  fail.watch(watch.fn)

  const $base64 = createStore('')

  persist({
    store: $base64,
    adapter: storageAdapter,
    key: 'contract-same-key-3',
    contract: (raw): raw is string =>
      global.Buffer.from(raw, 'base64').toString('base64') === raw,
    fail,
  })

  const { set: setFx } = createStorage({
    adapter: storageAdapter,
    key: 'contract-same-key-3',
    contract: (raw): raw is string =>
      global.Buffer.from(raw, 'base64').toString('base64') === raw,
  })

  setFx('plain value')
  assert.is(mockStorage.getItem('contract-same-key-3'), '"plain value"')

  assert.is($base64.getState(), '') // <- didn't change

  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [
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
  const watch = snoop(() => undefined)

  const Asteroid = Record({
    type: Literal('asteroid'),
    mass: Number,
  })

  mockStorage.setItem('asteroid0', '{"type":"asteroid","mass":42}')

  const { get: getFx } = createStorage({
    adapter: storageAdapter,
    key: 'asteroid0',
    contract: runtypeContract(Asteroid),
  })

  getFx.watch(watch.fn)
  getFx.finally.watch(watch.fn)

  getFx()

  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[0].arguments, [undefined]) // getFx trigger
  assert.equal(watch.calls[1].arguments, [
    {
      status: 'done',
      params: undefined,
      result: { type: 'asteroid', mass: 42 },
    },
  ]) // getFx result
})

test('shoult validate storage value on get with complex contract (valid undefined)', () => {
  const watch = snoop(() => undefined)

  const Asteroid = Optional(
    Record({
      type: Literal('asteroid'),
      mass: Number,
    })
  )

  const { get: getFx } = createStorage({
    adapter: storageAdapter,
    key: 'asteroid1',
    contract: runtypeContract(Asteroid),
  })

  getFx.watch(watch.fn)
  getFx.finally.watch(watch.fn)

  getFx()

  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[0].arguments, [undefined]) // getFx trigger
  assert.equal(watch.calls[1].arguments, [
    {
      status: 'done',
      params: undefined,
      result: undefined,
    },
  ]) // getFx result
})

test('shoult validate storage value on get with complex contract (invalid undefined)', () => {
  const watch = snoop(() => undefined)

  const Asteroid = Record({
    type: Literal('asteroid'),
    mass: Number,
  })

  const { get: getFx } = createStorage({
    adapter: storageAdapter,
    key: 'asteroid1',
    contract: runtypeContract(Asteroid),
  })

  getFx.watch(watch.fn)
  getFx.finally.watch(watch.fn)

  getFx()

  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[0].arguments, [undefined]) // getFx trigger
  assert.equal(watch.calls[1].arguments, [
    {
      status: 'fail',
      params: undefined,
      error: {
        key: 'asteroid1',
        keyPrefix: '',
        operation: 'validate',
        error: [
          'Expected { type: "asteroid"; mass: number; }, but was undefined',
        ],
        value: undefined,
      },
    },
  ]) // getFx result
})

test('shoult validate storage value on get with complex contract (invalid)', () => {
  const watch = snoop(() => undefined)

  const Asteroid = Record({
    type: Literal('asteroid'),
    mass: Number,
  })

  mockStorage.setItem('asteroid2', '42')

  const { get: getFx } = createStorage({
    adapter: storageAdapter,
    key: 'asteroid2',
    contract: runtypeContract(Asteroid),
  })

  getFx.watch(watch.fn)
  getFx.finally.watch(watch.fn)

  getFx()

  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[0].arguments, [undefined]) // getFx trigger
  assert.equal(watch.calls[1].arguments, [
    {
      status: 'fail',
      params: undefined,
      error: {
        key: 'asteroid2',
        keyPrefix: '',
        operation: 'validate',
        error: ['Expected { type: "asteroid"; mass: number; }, but was number'],
        value: 42,
      },
    },
  ]) // getFx result

  assert.is(mockStorage.getItem('asteroid2'), '42')
})

test('should validate value on storage external update', async () => {
  const watch = snoop(() => undefined)

  const { get: getFx } = createStorage({
    adapter: storageAdapter,
    key: 'storage-contract-counter-1',
    contract: runtypeContract(Number),
  })

  getFx.watch(watch.fn)
  getFx.finally.watch(watch.fn)

  mockStorage.setItem('storage-contract-counter-1', '1')
  await events.dispatchEvent('storage', {
    storageArea: mockStorage,
    key: 'storage-contract-counter-1',
    oldValue: null,
    newValue: '1',
  })

  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[0].arguments, ['1']) // getFx trigger with raw value
  assert.equal(watch.calls[1].arguments, [
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

  assert.is(watch.callCount, 4)
  assert.equal(watch.calls[2].arguments, ['"invalid"']) // getFx trigger with raw value
  assert.equal(watch.calls[3].arguments, [
    {
      status: 'fail',
      params: '"invalid"', // raw value from adapter
      error: {
        key: 'storage-contract-counter-1',
        keyPrefix: '',
        operation: 'validate',
        error: ['Expected number, but was string'],
        value: 'invalid',
      },
    },
  ]) // getFx result
})

//
// Launch tests
//

test.run()
