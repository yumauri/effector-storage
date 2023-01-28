import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { version, createEvent, createStore } from 'effector'
import { persist } from '../src/core'
import { storage } from '../src/storage'
import { createStorageMock } from './mocks/storage.mock'

//
// Effector version guard
//

let warn = true
function old(need = '22.4') {
  if (version < need) {
    if (warn) {
      console.log(
        '// skip native serialization tests due to old effector version'
      )
      warn = false
    }
    return true
  }
  return false
}

//
// `btoa` and `atob` node ponyfills
//

declare let Buffer: any

const btoa = (b: string): string =>
  b && Buffer.from(b, 'binary').toString('base64')
const atob = (a: string): string =>
  a && Buffer.from(a, 'base64').toString('binary')

//
// Tests
//

test('store native serialization should be taken into account', () => {
  if (old()) return

  const mockStorage = createStorageMock()
  const storageAdapter = storage({ storage: () => mockStorage, sync: false })
  mockStorage.setItem('date', '473684400000')

  const $date = createStore<Date>(new Date(), {
    // @ts-expect-error due to old typings in import
    serialize: {
      write: (date: Date) => date.getTime(),
      read: (timestamp: number) => new Date(timestamp),
    },
  })

  persist({
    adapter: storageAdapter,
    store: $date,
    key: 'date',
  })

  assert.is(mockStorage.getItem('date'), '473684400000')
  assert.is($date.getState().toISOString(), '1985-01-04T11:00:00.000Z')
  ;($date as any).setState(new Date('1999-02-04T10:00:00.000Z'))
  assert.is(mockStorage.getItem('date'), '918122400000')
})

test('store native serialization should work alongside adapter serialization', () => {
  if (old()) return

  const mockStorage = createStorageMock()
  const storageAdapter = storage({
    storage: () => mockStorage,
    sync: false,
    serialize: (value: number) => btoa(String(value)), // to base64 string
    deserialize: (value: string) => Number(atob(value)), // from base64 string
  })
  mockStorage.setItem('date', 'NDczNjg0NDAwMDAw') // '473684400000' in base64

  const $date = createStore<Date>(new Date(), {
    // @ts-expect-error due to old typings in import
    serialize: {
      write: (date: Date) => date.getTime(),
      read: (timestamp: number) => new Date(timestamp),
    },
  })

  persist({
    adapter: storageAdapter,
    store: $date,
    key: 'date',
  })

  assert.is(mockStorage.getItem('date'), 'NDczNjg0NDAwMDAw') // '473684400000' in base64
  assert.is($date.getState().toISOString(), '1985-01-04T11:00:00.000Z')
  ;($date as any).setState(new Date('1999-02-04T10:00:00.000Z'))
  assert.is(mockStorage.getItem('date'), 'OTE4MTIyNDAwMDAw') // '918122400000' in base64
})

test('store native serialize:ignore should be persisted anyways', () => {
  if (old('22.0')) return

  const mockStorage = createStorageMock()
  const storageAdapter = storage({ storage: () => mockStorage, sync: false })

  const $data = createStore(0, {
    // @ts-expect-error due to old typings in import
    serialize: 'ignore',
  })

  persist({
    adapter: storageAdapter,
    store: $data,
    key: 'data',
  })

  //
  ;($data as any).setState(42)
  assert.is(mockStorage.getItem('data'), '42')
})

test('should sync stores with same key and different serializations', () => {
  if (old()) return

  const mockStorage = createStorageMock()
  const storageAdapter = storage({ storage: () => mockStorage, sync: false })

  const watch = snoop(() => undefined)

  const $string = createStore('test', {
    // @ts-expect-error due to old typings in import
    serialize: { write: btoa, read: atob },
  })
  const $base64 = createStore('aGVsbG8=') // 'hello'
  $string.watch(watch.fn)
  $base64.watch(watch.fn)

  assert.is($string.getState(), 'test')
  assert.is($base64.getState(), 'aGVsbG8=')
  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[0].arguments, ['test'])
  assert.equal(watch.calls[1].arguments, ['aGVsbG8='])

  persist({ store: $string, adapter: storageAdapter, key: 'same-key' })
  persist({ store: $base64, adapter: storageAdapter, key: 'same-key' })

  //
  ;($string as any).setState('world')
  assert.is(mockStorage.getItem('same-key'), '"d29ybGQ="')

  assert.is($string.getState(), 'world')
  assert.is($base64.getState(), 'd29ybGQ=') // <- also changes, but to base64
  assert.is(watch.callCount, 4)
  assert.equal(watch.calls[2].arguments, ['world'])
  assert.equal(watch.calls[3].arguments, ['d29ybGQ='])
})

test('should fire done and finally events once each', () => {
  if (old()) return

  const mockStorage = createStorageMock()
  const storageAdapter = storage({ storage: () => mockStorage, sync: false })
  mockStorage.setItem('test', '"dGVzdA=="') // 'test'

  const watch = snoop(() => undefined)

  const done = createEvent<any>()
  const anyway = createEvent<any>()
  done.watch(watch.fn)
  anyway.watch(watch.fn)

  const $store = createStore('', {
    // @ts-expect-error due to old typings in import
    serialize: { write: btoa, read: atob },
  })

  persist({
    store: $store,
    adapter: storageAdapter,
    key: 'test',
    done,
    finally: anyway,
  })

  assert.is(watch.callCount, 2)

  // `finally`, get value from storage
  assert.equal(watch.calls[0].arguments, [
    {
      key: 'test',
      keyPrefix: '',
      operation: 'get',
      status: 'done',
      value: 'dGVzdA==',
    },
  ])

  // `done`, get value from storage
  assert.equal(watch.calls[1].arguments, [
    {
      key: 'test',
      keyPrefix: '',
      operation: 'get',
      value: 'dGVzdA==',
    },
  ])
})

test('failed native serialization should be trigger `fail` and `finally` event with type `read` or `write`', () => {
  if (old()) return

  const mockStorage = createStorageMock()
  const storageAdapter = storage({ storage: () => mockStorage, sync: false })
  mockStorage.setItem('error-key', '42')

  const watch = snoop(() => undefined)

  const error = createEvent<any>()
  error.watch(watch.fn)

  const $store = createStore(0, {
    // @ts-expect-error due to old typings in import
    serialize: {
      write() {
        throw 'write' // eslint-disable-line no-throw-literal
      },
      read() {
        throw 'read' // eslint-disable-line no-throw-literal
      },
    },
  })

  persist({
    store: $store,
    adapter: storageAdapter,
    key: 'error-key',
    fail: error,
    finally: error, // this will trigger successful `get`, but failed `read`/`write`
  })

  assert.is($store.getState(), 0) // didn't change
  assert.is(watch.callCount, 3)

  // .finally -> successful `get`, because adapter gets value from storage without errors
  assert.equal(watch.calls[0].arguments, [
    {
      status: 'done',
      key: 'error-key',
      keyPrefix: '',
      operation: 'get',
      value: 42,
    },
  ])

  // .finally -> failed `read`, because deserialization was failed
  assert.equal(watch.calls[1].arguments, [
    {
      status: 'fail',
      key: 'error-key',
      keyPrefix: '',
      operation: 'read',
      value: 42,
      error: 'read',
    },
  ])

  // .fail -> failed `read`, because deserialization was failed
  assert.equal(watch.calls[2].arguments, [
    {
      key: 'error-key',
      keyPrefix: '',
      operation: 'read',
      error: 'read',
      value: 42,
    },
  ])

  //
  ;($store as any).setState(1)
  assert.is(watch.callCount, 5)

  // .finally -> failed `write`, because serialization was failed
  assert.equal(watch.calls[3].arguments, [
    {
      status: 'fail',
      key: 'error-key',
      keyPrefix: '',
      operation: 'write',
      value: 1,
      error: 'write',
    },
  ])

  // .fail -> failed `write`, because serialization was failed
  assert.equal(watch.calls[4].arguments, [
    {
      key: 'error-key',
      keyPrefix: '',
      operation: 'write',
      error: 'write',
      value: 1,
    },
  ])
})

//
// Launch tests
//

test.run()
