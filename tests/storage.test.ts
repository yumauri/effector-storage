import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore, createEvent } from 'effector'
import { persist } from '../src/core'
import { storage } from '../src/storage'
import { createStorageMock } from './mocks/storage.mock'

//
// Mock abstract Storage adapter
//

const mockStorage = createStorageMock()
const storageAdapter = storage({ storage: mockStorage })

//
// Tests
//

test('store initial value should NOT be saved to storage', () => {
  const $counter1 = createStore(0, { name: 'counter1' })
  persist({ store: $counter1, adapter: storageAdapter })
  assert.is(mockStorage.getItem('counter1'), null)
  assert.is($counter1.getState(), 0)
})

test('store new value should be saved to storage', () => {
  const $counter2 = createStore(0, { name: 'counter2' })
  persist({ store: $counter2, adapter: storageAdapter })
  assert.is(mockStorage.getItem('counter2'), null)
  ;($counter2 as any).setState(3)
  assert.is(mockStorage.getItem('counter2'), '3')
  assert.is(
    $counter2.getState(),
    JSON.parse(mockStorage.getItem('counter2') as any)
  )
})

test('key should have precedence over name', () => {
  const $namekey = createStore(0, { name: 'precedence::name' })
  persist({ store: $namekey, adapter: storageAdapter, key: 'precedence::key' })
  assert.is(mockStorage.getItem('precedence::name'), null)
  assert.is(mockStorage.getItem('precedence::key'), null)
  ;($namekey as any).setState(42)
  assert.is(mockStorage.getItem('precedence::name'), null)
  assert.is(mockStorage.getItem('precedence::key'), '42')
})

test('store should be initialized from storage value', () => {
  mockStorage.setItem('counter3', '42')
  const $counter3 = createStore(0, { name: 'counter3' })
  persist({ store: $counter3, adapter: storageAdapter })
  assert.is(mockStorage.getItem('counter3'), '42')
  assert.is($counter3.getState(), 42)
})

test('reset store should reset it to given initial value', () => {
  mockStorage.setItem('counter4', '42')
  const reset = createEvent()
  const $counter4 = createStore(0, { name: 'counter4' }).reset(reset)
  persist({ store: $counter4, adapter: storageAdapter })
  assert.is(mockStorage.getItem('counter4'), '42')
  assert.is($counter4.getState(), 42)
  reset()
  assert.is(mockStorage.getItem('counter4'), '0')
  assert.is($counter4.getState(), 0)
})

test('broken storage value should be ignored', () => {
  const error = snoop(() => undefined)
  const consoleError = console.error
  console.error = error.fn

  try {
    mockStorage.setItem('counter5', 'broken')
    const $counter5 = createStore(13, { name: 'counter5' })
    persist({ store: $counter5, adapter: storageAdapter })
    assert.is(mockStorage.getItem('counter5'), 'broken')
    assert.is($counter5.getState(), 13)

    assert.is(error.callCount, 1)
    assert.instance(error.calls[0].arguments[0 as any], SyntaxError)
  } finally {
    console.error = consoleError
  }
})

test('broken storage value should launch `catch` handler', () => {
  const handler = createEvent<any>()
  const watch = snoop(() => undefined)
  handler.watch(watch.fn)

  mockStorage.setItem('counter6', 'broken')
  const $counter6 = createStore(13, { name: 'counter6' })
  persist({ store: $counter6, adapter: storageAdapter, fail: handler })

  assert.is(watch.callCount, 1)
  assert.is(watch.calls[0].arguments.length, 1)

  const { error, ...args } = watch.calls[0].arguments[0 as any] as any
  assert.equal(args, {
    key: 'counter6',
    keyPrefix: '',
    operation: 'get',
    value: undefined,
  })
  assert.instance(error, SyntaxError)

  assert.is(mockStorage.getItem('counter6'), 'broken')
  assert.is($counter6.getState(), 13)
})

test('should not fail if error handler is absent', () => {
  const error = snoop(() => undefined)
  const consoleError = console.error
  console.error = error.fn

  try {
    const $store0 = createStore({ test: 1 }, { name: 'store0' })
    persist({ store: $store0, adapter: storageAdapter })

    assert.is(mockStorage.getItem('store0'), null)

    const recursive = {}
    ;(recursive as any).recursive = recursive
    ;($store0 as any).setState(recursive)

    assert.is(mockStorage.getItem('store0'), null)
    assert.is($store0.getState(), recursive)

    assert.is(error.callCount, 1)
    assert.instance(error.calls[0].arguments[0 as any], TypeError)
  } finally {
    console.error = consoleError
  }
})

test('broken store value should launch `catch` handler', () => {
  const handler = createEvent<any>()
  const watch = snoop(() => undefined)
  handler.watch(watch.fn)

  const $store1 = createStore({ test: 1 }, { name: 'store1' })
  persist({ store: $store1, adapter: storageAdapter, fail: handler })

  assert.is(mockStorage.getItem('store1'), null)
  assert.equal($store1.getState(), { test: 1 })

  const recursive = {}
  ;(recursive as any).recursive = recursive
  ;($store1 as any).setState(recursive)

  assert.is(watch.callCount, 1)
  assert.is(watch.calls[0].arguments.length, 1)

  const { error, ...args } = watch.calls[0].arguments[0 as any] as any
  assert.equal(args, {
    key: 'store1',
    keyPrefix: '',
    operation: 'set',
    value: recursive,
  })
  assert.instance(error, TypeError)

  assert.is(mockStorage.getItem('store1'), null)
  assert.is($store1.getState(), recursive)
})

test('different storage instances should not interfere', () => {
  const mockStorage1 = createStorageMock()
  const storageAdapter1 = storage({ storage: mockStorage1 })
  const mockStorage2 = createStorageMock()
  const storageAdapter2 = storage({ storage: mockStorage2 })

  mockStorage1.setItem('custom', '111')
  mockStorage2.setItem('custom', '222')

  const $counter1 = createStore(0)
  persist({ store: $counter1, adapter: storageAdapter1, key: 'custom' })

  const $counter2 = createStore(0)
  persist({ store: $counter2, adapter: storageAdapter2, key: 'custom' })

  assert.is(mockStorage1.getItem('custom'), '111')
  assert.is(mockStorage2.getItem('custom'), '222')
  assert.is($counter1.getState(), 111)
  ;($counter1 as any).setState(333)
  assert.is(mockStorage1.getItem('custom'), '333')
  assert.is(mockStorage2.getItem('custom'), '222')
  assert.is(
    $counter1.getState(),
    JSON.parse(mockStorage1.getItem('custom') as any)
  )
  ;($counter2 as any).setState(444)
  assert.is(mockStorage1.getItem('custom'), '333')
  assert.is(mockStorage2.getItem('custom'), '444')
  assert.is(
    $counter2.getState(),
    JSON.parse(mockStorage2.getItem('custom') as any)
  )
})

test('should be possible to use custom serialization', () => {
  const mockStorage = createStorageMock()
  const storageDateAdapter = storage({
    storage: mockStorage,
    sync: false,
    serialize: (date: Date) => String(date.getTime()),
    deserialize: (timestamp: string) => new Date(Number(timestamp)),
  })

  mockStorage.setItem('date', '473684400000')

  const $date = createStore(new Date())
  persist({ store: $date, adapter: storageDateAdapter, key: 'date' })

  assert.is(mockStorage.getItem('date'), '473684400000')
  assert.is($date.getState().toISOString(), '1985-01-04T11:00:00.000Z')
  ;($date as any).setState(new Date('1999-02-04T10:00:00.000Z'))
  assert.is(mockStorage.getItem('date'), '918122400000')
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

  assert.equal($coords.getState(), { x: 42, y: 24 })
  setX(25)
  assert.equal($coords.getState(), { x: 25, y: 24 })
  assert.is(mockStorage.getItem('part::x'), '25')
  assert.is(mockStorage.getItem('part::y'), '24')
})

test('should sync stores, persisted to the same adapter-key, but different adapters', () => {
  const watch = snoop(() => undefined)

  const mockStorage = createStorageMock()
  mockStorage.setItem('same-key-1', '0')

  const adapter1 = storage({ storage: mockStorage, sync: false })
  const adapter2 = storage({ storage: mockStorage, sync: true })

  const $store0 = createStore(1)
  const $store1 = createStore(2)
  $store0.watch(watch.fn)
  $store1.watch(watch.fn)

  assert.is($store0.getState(), 1)
  assert.is($store1.getState(), 2)
  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[0].arguments, [1])
  assert.equal(watch.calls[1].arguments, [2])

  persist({ store: $store0, adapter: adapter1, key: 'same-key-1' })
  persist({ store: $store1, adapter: adapter2, key: 'same-key-1' })

  assert.is($store0.getState(), 0)
  assert.is($store1.getState(), 0)
  assert.is(watch.callCount, 4)
  assert.equal(watch.calls[2].arguments, [0])
  assert.equal(watch.calls[3].arguments, [0])

  //
  ;($store0 as any).setState(3)

  assert.is($store0.getState(), 3)
  assert.is($store1.getState(), 3) // <- also changes
  assert.is(watch.callCount, 6)
  assert.equal(watch.calls[4].arguments, [3])
  assert.equal(watch.calls[5].arguments, [3])
})

//
// Launch tests
//

test.run()
