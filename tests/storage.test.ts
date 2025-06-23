import { test, mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { createStore, createEvent } from 'effector'
import { persist } from '../src/core'
import { storage } from '../src/storage'
import { storage as storageIndex } from '../src'
import { createStorageMock } from './mocks/storage.mock'

//
// Mock abstract Storage adapter
//

const mockStorage = createStorageMock()
const storageAdapter = storage({ storage: () => mockStorage })

//
// Tests
//

test('should be exported from package root', () => {
  assert.strictEqual(storage, storageIndex)
})

test('store initial value should NOT be saved to storage', () => {
  const $counter1 = createStore(0, { name: 'counter1' })
  persist({ store: $counter1, adapter: storageAdapter })
  assert.strictEqual(mockStorage.getItem('counter1'), null)
  assert.strictEqual($counter1.getState(), 0)
})

test('store new value should be saved to storage', () => {
  const $counter2 = createStore(0, { name: 'counter2' })
  persist({ store: $counter2, adapter: storageAdapter })
  assert.strictEqual(mockStorage.getItem('counter2'), null)
  ;($counter2 as any).setState(3)
  assert.strictEqual(mockStorage.getItem('counter2'), '3')
  assert.strictEqual(
    $counter2.getState(),
    JSON.parse(mockStorage.getItem('counter2') as any)
  )
})

test('key should have precedence over name', () => {
  const $namekey = createStore(0, { name: 'precedence::name' })
  persist({ store: $namekey, adapter: storageAdapter, key: 'precedence::key' })
  assert.strictEqual(mockStorage.getItem('precedence::name'), null)
  assert.strictEqual(mockStorage.getItem('precedence::key'), null)
  ;($namekey as any).setState(42)
  assert.strictEqual(mockStorage.getItem('precedence::name'), null)
  assert.strictEqual(mockStorage.getItem('precedence::key'), '42')
})

test('store should be initialized from storage value', () => {
  mockStorage.setItem('counter3', '42')
  const $counter3 = createStore(0, { name: 'counter3' })
  persist({ store: $counter3, adapter: storageAdapter })
  assert.strictEqual(mockStorage.getItem('counter3'), '42')
  assert.strictEqual($counter3.getState(), 42)
})

test('store should be initialized with default value', () => {
  const $counter31 = createStore(0, { name: 'counter31' })
  const adapter = storage({ storage: () => mockStorage, def: 42 })
  persist({ store: $counter31, adapter })
  assert.strictEqual(mockStorage.getItem('counter31'), null)
  assert.strictEqual($counter31.getState(), 42)
})

test('store should be initialized from storage value, not default value', () => {
  mockStorage.setItem('counter32', '42')
  const adapter = storage({ storage: () => mockStorage, def: 21 })
  const $counter32 = createStore(0, { name: 'counter32' })
  persist({ store: $counter32, adapter })
  assert.strictEqual(mockStorage.getItem('counter32'), '42')
  assert.strictEqual($counter32.getState(), 42)
})

test('reset store should reset it to given initial value', () => {
  mockStorage.setItem('counter4', '42')
  const reset = createEvent()
  const $counter4 = createStore(0, { name: 'counter4' }).reset(reset)
  persist({ store: $counter4, adapter: storageAdapter })
  assert.strictEqual(mockStorage.getItem('counter4'), '42')
  assert.strictEqual($counter4.getState(), 42)
  reset()
  assert.strictEqual(mockStorage.getItem('counter4'), '0')
  assert.strictEqual($counter4.getState(), 0)
})

test('broken storage value should be ignored', () => {
  const error = mock.fn()
  const consoleError = console.error
  console.error = error

  try {
    mockStorage.setItem('counter5', 'broken')
    const $counter5 = createStore(13, { name: 'counter5' })
    persist({ store: $counter5, adapter: storageAdapter })
    assert.strictEqual(mockStorage.getItem('counter5'), 'broken')
    assert.strictEqual($counter5.getState(), 13)

    assert.strictEqual(error.mock.callCount(), 1)
    assert.ok(
      (error.mock.calls[0].arguments[0 as any] as any) instanceof SyntaxError
    )
  } finally {
    console.error = consoleError
  }
})

test('broken storage value should launch `catch` handler', () => {
  const handler = createEvent<any>()
  const watch = mock.fn()
  handler.watch(watch)

  mockStorage.setItem('counter6', 'broken')
  const $counter6 = createStore(13, { name: 'counter6' })
  persist({ store: $counter6, adapter: storageAdapter, fail: handler })

  assert.strictEqual(watch.mock.callCount(), 1)
  assert.strictEqual(watch.mock.calls[0].arguments.length, 1)

  const { error, ...args } = watch.mock.calls[0].arguments[0 as any] as any
  assert.deepEqual(args, {
    key: 'counter6',
    keyPrefix: '',
    operation: 'get',
    value: undefined,
  })
  assert.ok(error instanceof SyntaxError)

  assert.strictEqual(mockStorage.getItem('counter6'), 'broken')
  assert.strictEqual($counter6.getState(), 13)
})

test('should not fail if error handler is absent', () => {
  const error = mock.fn()
  const consoleError = console.error
  console.error = error

  try {
    const $store0 = createStore({ test: 1 }, { name: 'store0' })
    persist({ store: $store0, adapter: storageAdapter })

    assert.strictEqual(mockStorage.getItem('store0'), null)

    const recursive = {}
    ;(recursive as any).recursive = recursive
    ;($store0 as any).setState(recursive)

    assert.strictEqual(mockStorage.getItem('store0'), null)
    assert.strictEqual($store0.getState(), recursive)

    assert.strictEqual(error.mock.callCount(), 1)
    assert.ok(
      (error.mock.calls[0].arguments[0 as any] as any) instanceof TypeError
    )
  } finally {
    console.error = consoleError
  }
})

test('broken store value should launch `catch` handler', () => {
  const handler = createEvent<any>()
  const watch = mock.fn()
  handler.watch(watch)

  const $store1 = createStore({ test: 1 }, { name: 'store1' })
  persist({ store: $store1, adapter: storageAdapter, fail: handler })

  assert.strictEqual(mockStorage.getItem('store1'), null)
  assert.deepEqual($store1.getState(), { test: 1 })

  const recursive = {}
  ;(recursive as any).recursive = recursive
  ;($store1 as any).setState(recursive)

  assert.strictEqual(watch.mock.callCount(), 1)
  assert.strictEqual(watch.mock.calls[0].arguments.length, 1)

  const { error, ...args } = watch.mock.calls[0].arguments[0 as any] as any
  assert.deepEqual(args, {
    key: 'store1',
    keyPrefix: '',
    operation: 'set',
    value: recursive,
  })
  assert.ok(error instanceof TypeError)

  assert.strictEqual(mockStorage.getItem('store1'), null)
  assert.strictEqual($store1.getState(), recursive)
})

test('different storage instances should not interfere', () => {
  const mockStorage1 = createStorageMock()
  const storageAdapter1 = storage({ storage: () => mockStorage1 })
  const mockStorage2 = createStorageMock()
  const storageAdapter2 = storage({ storage: () => mockStorage2 })

  mockStorage1.setItem('custom', '111')
  mockStorage2.setItem('custom', '222')

  const $counter1 = createStore(0)
  persist({ store: $counter1, adapter: storageAdapter1, key: 'custom' })

  const $counter2 = createStore(0)
  persist({ store: $counter2, adapter: storageAdapter2, key: 'custom' })

  assert.strictEqual(mockStorage1.getItem('custom'), '111')
  assert.strictEqual(mockStorage2.getItem('custom'), '222')
  assert.strictEqual($counter1.getState(), 111)
  ;($counter1 as any).setState(333)
  assert.strictEqual(mockStorage1.getItem('custom'), '333')
  assert.strictEqual(mockStorage2.getItem('custom'), '222')
  assert.strictEqual(
    $counter1.getState(),
    JSON.parse(mockStorage1.getItem('custom') as any)
  )
  ;($counter2 as any).setState(444)
  assert.strictEqual(mockStorage1.getItem('custom'), '333')
  assert.strictEqual(mockStorage2.getItem('custom'), '444')
  assert.strictEqual(
    $counter2.getState(),
    JSON.parse(mockStorage2.getItem('custom') as any)
  )
})

test('should be possible to use custom serialization', () => {
  const mockStorage = createStorageMock()
  const storageDateAdapter = storage({
    storage: () => mockStorage,
    sync: false,
    serialize: (date: Date) => String(date.getTime()),
    deserialize: (timestamp: string) => new Date(Number(timestamp)),
  })

  mockStorage.setItem('date', '473684400000')

  const $date = createStore(new Date())
  persist({ store: $date, adapter: storageDateAdapter, key: 'date' })

  assert.strictEqual(mockStorage.getItem('date'), '473684400000')
  assert.strictEqual($date.getState().toISOString(), '1985-01-04T11:00:00.000Z')
  ;($date as any).setState(new Date('1999-02-04T10:00:00.000Z'))
  assert.strictEqual(mockStorage.getItem('date'), '918122400000')
})

test('should be possible to persist part of the store', () => {
  mockStorage.setItem('part::x', '42')
  mockStorage.setItem('part::y', '24')

  const setX = createEvent<number>()
  const setY = createEvent<number>()
  const $coords = createStore<{ x: number; y: number }>({ x: 0, y: 0 })
    .on(setX, ({ y }, x) => ({ x, y }))
    .on(setY, ({ x }, y) => ({ x, y }))

  persist({
    adapter: storageAdapter,
    source: $coords.map(({ x }) => x),
    target: setX,
    key: 'part::x',
  })

  persist({
    adapter: storageAdapter,
    source: $coords.map(({ y }) => y),
    target: setY,
    key: 'part::y',
  })

  assert.deepEqual($coords.getState(), { x: 42, y: 24 })
  setX(25)
  assert.deepEqual($coords.getState(), { x: 25, y: 24 })
  assert.strictEqual(mockStorage.getItem('part::x'), '25')
  assert.strictEqual(mockStorage.getItem('part::y'), '24')
})

test('should sync stores, persisted to the same adapter-key, but different adapters', () => {
  const watch = mock.fn()

  const mockStorage = createStorageMock()
  mockStorage.setItem('same-key-1', '0')

  const adapter1 = storage({ storage: () => mockStorage, sync: false })
  const adapter2 = storage({ storage: () => mockStorage, sync: true })

  const $store0 = createStore(1)
  const $store1 = createStore(2)
  $store0.watch(watch)
  $store1.watch(watch)

  assert.strictEqual($store0.getState(), 1)
  assert.strictEqual($store1.getState(), 2)
  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[0].arguments, [1])
  assert.deepEqual(watch.mock.calls[1].arguments, [2])

  persist({ store: $store0, adapter: adapter1, key: 'same-key-1' })
  persist({ store: $store1, adapter: adapter2, key: 'same-key-1' })

  assert.strictEqual($store0.getState(), 0)
  assert.strictEqual($store1.getState(), 0)
  assert.strictEqual(watch.mock.callCount(), 4)
  assert.deepEqual(watch.mock.calls[2].arguments, [0])
  assert.deepEqual(watch.mock.calls[3].arguments, [0])

  //
  ;($store0 as any).setState(3)

  assert.strictEqual($store0.getState(), 3)
  assert.strictEqual($store1.getState(), 3) // <- also changes
  assert.strictEqual(watch.mock.callCount(), 6)
  assert.deepEqual(watch.mock.calls[4].arguments, [3])
  assert.deepEqual(watch.mock.calls[5].arguments, [3])
})
