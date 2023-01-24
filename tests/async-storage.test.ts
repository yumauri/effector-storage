import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore, createEvent } from 'effector'
import { persist } from '../src/core'
import { asyncStorage } from '../src/async-storage'
import { createAsyncStorageMock } from './mocks/async-storage.mock'

//
// Mock abstract AsyncStorage adapter
//

const mockAsyncStorage = createAsyncStorageMock()
const asyncStorageAdapter = asyncStorage({ storage: () => mockAsyncStorage })

const timeout = (t: number) => new Promise((resolve) => setTimeout(resolve, t))

//
// Tests
//

test('store initial value should NOT be saved to storage', async () => {
  const $counter1 = createStore(0, { name: 'counter1' })
  persist({ store: $counter1, adapter: asyncStorageAdapter })
  await timeout(0)
  assert.is(await mockAsyncStorage.getItem('counter1'), null)
  assert.is($counter1.getState(), 0)
})

test('store new value should be saved to storage', async () => {
  const $counter2 = createStore(0, { name: 'counter2' })
  persist({ store: $counter2, adapter: asyncStorageAdapter })
  await timeout(0)
  assert.is(await mockAsyncStorage.getItem('counter2'), null)
  ;($counter2 as any).setState(3)
  await timeout(0)
  assert.is(await mockAsyncStorage.getItem('counter2'), '3')
  assert.is(
    $counter2.getState(),
    JSON.parse((await mockAsyncStorage.getItem('counter2')) as any)
  )
})

test('key should have precedence over name', async () => {
  const $namekey = createStore(0, { name: 'precedence::name' })
  persist({
    store: $namekey,
    adapter: asyncStorageAdapter,
    key: 'precedence::key',
  })
  await timeout(0)
  assert.is(await mockAsyncStorage.getItem('precedence::name'), null)
  assert.is(await mockAsyncStorage.getItem('precedence::key'), null)
  ;($namekey as any).setState(42)
  await timeout(0)
  assert.is(await mockAsyncStorage.getItem('precedence::name'), null)
  assert.is(await mockAsyncStorage.getItem('precedence::key'), '42')
})

test('store should be initialized from storage value', async () => {
  await mockAsyncStorage.setItem('counter3', '42')
  const $counter3 = createStore(0, { name: 'counter3' })
  persist({ store: $counter3, adapter: asyncStorageAdapter })
  await timeout(0)
  assert.is(await mockAsyncStorage.getItem('counter3'), '42')
  assert.is($counter3.getState(), 42)
})

test('reset store should reset it to given initial value', async () => {
  await mockAsyncStorage.setItem('counter4', '42')
  const reset = createEvent()
  const $counter4 = createStore(0, { name: 'counter4' }).reset(reset)
  persist({ store: $counter4, adapter: asyncStorageAdapter })
  await timeout(0)
  assert.is(await mockAsyncStorage.getItem('counter4'), '42')
  assert.is($counter4.getState(), 42)
  reset()
  await timeout(0)
  assert.is(await mockAsyncStorage.getItem('counter4'), '0')
  assert.is($counter4.getState(), 0)
})

test('broken storage value should be ignored', async () => {
  const error = snoop(() => undefined)
  const consoleError = console.error
  console.error = error.fn

  try {
    await mockAsyncStorage.setItem('counter5', 'broken')
    const $counter5 = createStore(13, { name: 'counter5' })
    persist({ store: $counter5, adapter: asyncStorageAdapter })
    await timeout(0)
    assert.is(await mockAsyncStorage.getItem('counter5'), 'broken')
    assert.is($counter5.getState(), 13)

    assert.is(error.callCount, 1)
    assert.instance(error.calls[0].arguments[0 as any], SyntaxError)
  } finally {
    console.error = consoleError
  }
})

test('broken storage value should launch `catch` handler', async () => {
  const handler = createEvent<any>()
  const watch = snoop(() => undefined)
  handler.watch(watch.fn)

  await mockAsyncStorage.setItem('counter6', 'broken')
  const $counter6 = createStore(13, { name: 'counter6' })
  persist({ store: $counter6, adapter: asyncStorageAdapter, fail: handler })
  await timeout(0)

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

  assert.is(await mockAsyncStorage.getItem('counter6'), 'broken')
  assert.is($counter6.getState(), 13)
})

test('should not fail if error handler is absent', async () => {
  const error = snoop(() => undefined)
  const consoleError = console.error
  console.error = error.fn

  try {
    const $store0 = createStore({ test: 1 }, { name: 'store0' })
    persist({ store: $store0, adapter: asyncStorageAdapter })
    await timeout(0)

    assert.is(await mockAsyncStorage.getItem('store0'), null)

    const recursive = {}
    ;(recursive as any).recursive = recursive
    ;($store0 as any).setState(recursive)
    await timeout(0)

    assert.is(await mockAsyncStorage.getItem('store0'), null)
    assert.is($store0.getState(), recursive)

    assert.is(error.callCount, 1)
    assert.instance(error.calls[0].arguments[0 as any], TypeError)
  } finally {
    console.error = consoleError
  }
})

test('broken store value should launch `catch` handler', async () => {
  const handler = createEvent<any>()
  const watch = snoop(() => undefined)
  handler.watch(watch.fn)

  const $store1 = createStore({ test: 1 }, { name: 'store1' })
  persist({ store: $store1, adapter: asyncStorageAdapter, fail: handler })
  await timeout(0)

  assert.is(await mockAsyncStorage.getItem('store1'), null)
  assert.equal($store1.getState(), { test: 1 })

  const recursive = {}
  ;(recursive as any).recursive = recursive
  ;($store1 as any).setState(recursive)
  await timeout(0)

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

  assert.is(await mockAsyncStorage.getItem('store1'), null)
  assert.is($store1.getState(), recursive)
})

test('different storage instances should not interfere', async () => {
  const mockStorage1 = createAsyncStorageMock()
  const storageAdapter1 = asyncStorage({ storage: () => mockStorage1 })
  const mockStorage2 = createAsyncStorageMock()
  const storageAdapter2 = asyncStorage({ storage: () => mockStorage2 })

  await mockStorage1.setItem('custom', '111')
  await mockStorage2.setItem('custom', '222')

  const $counter1 = createStore(0)
  persist({ store: $counter1, adapter: storageAdapter1, key: 'custom' })
  await timeout(0)

  const $counter2 = createStore(0)
  persist({ store: $counter2, adapter: storageAdapter2, key: 'custom' })
  await timeout(0)

  assert.is(await mockStorage1.getItem('custom'), '111')
  assert.is(await mockStorage2.getItem('custom'), '222')
  assert.is($counter1.getState(), 111)
  ;($counter1 as any).setState(333)
  await timeout(0)
  assert.is(await mockStorage1.getItem('custom'), '333')
  assert.is(await mockStorage2.getItem('custom'), '222')
  assert.is(
    $counter1.getState(),
    JSON.parse((await mockStorage1.getItem('custom')) as any)
  )
  ;($counter2 as any).setState(444)
  await timeout(0)
  assert.is(await mockStorage1.getItem('custom'), '333')
  assert.is(await mockStorage2.getItem('custom'), '444')
  assert.is(
    $counter2.getState(),
    JSON.parse((await mockStorage2.getItem('custom')) as any)
  )
})

test('should be possible to use custom serialization', async () => {
  const mockStorage = createAsyncStorageMock()
  const storageDateAdapter = asyncStorage({
    storage: () => mockStorage,
    serialize: (date: Date) => String(date.getTime()),
    deserialize: (timestamp: string) => new Date(Number(timestamp)),
  })

  await mockStorage.setItem('date', '473684400000')

  const $date = createStore(new Date())
  persist({ store: $date, adapter: storageDateAdapter, key: 'date' })
  await timeout(0)

  assert.is(await mockStorage.getItem('date'), '473684400000')
  assert.is($date.getState().toISOString(), '1985-01-04T11:00:00.000Z')
  ;($date as any).setState(new Date('1999-02-04T10:00:00.000Z'))
  await timeout(0)
  assert.is(await mockStorage.getItem('date'), '918122400000')
})

test('should be possible to persist part of the store', async () => {
  await mockAsyncStorage.setItem('part::x', '42')
  await mockAsyncStorage.setItem('part::y', '24')

  const setX = createEvent<number>()
  const setY = createEvent<number>()
  const $coords = createStore<{ x: number; y: number }>({ x: 0, y: 0 })
    .on(setX, ({ y }, x) => ({ x, y }))
    .on(setY, ({ x }, y) => ({ x, y }))

  persist({
    adapter: asyncStorageAdapter,
    source: $coords.map(({ x }) => x),
    target: setX,
    key: 'part::x',
  })

  persist({
    adapter: asyncStorageAdapter,
    source: $coords.map(({ y }) => y),
    target: setY,
    key: 'part::y',
  })

  await timeout(0)

  assert.equal($coords.getState(), { x: 42, y: 24 })
  setX(25)

  await timeout(0)

  assert.equal($coords.getState(), { x: 25, y: 24 })
  assert.is(await mockAsyncStorage.getItem('part::x'), '25')
  assert.is(await mockAsyncStorage.getItem('part::y'), '24')
})

test('should sync stores, persisted to the same adapter-key, but different adapters', async () => {
  const watch = snoop(() => undefined)

  const mockStorage = createAsyncStorageMock()
  await mockStorage.setItem('same-key-1', '0')

  const adapter1 = asyncStorage({
    storage: () => mockStorage,
    serialize: (value) => String(value),
    deserialize: (value) => Number(value),
  })
  const adapter2 = asyncStorage({ storage: () => mockStorage })

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

  await timeout(0)

  assert.is($store0.getState(), 0)
  assert.is($store1.getState(), 0)
  assert.is(watch.callCount, 4)
  assert.equal(watch.calls[2].arguments, [0])
  assert.equal(watch.calls[3].arguments, [0])

  //
  ;($store0 as any).setState(3)
  await timeout(0)

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
