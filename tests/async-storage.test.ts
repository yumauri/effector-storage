import { createEvent, createStore } from 'effector'
import { expect, it, vi } from 'vitest'
import { asyncStorage as asyncStorageIndex } from '../src'
import { asyncStorage } from '../src/async-storage'
import { persist } from '../src/core'
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

it('should be exported from package root', () => {
  expect(asyncStorage).toBe(asyncStorageIndex)
})

it('store initial value should NOT be saved to storage', async () => {
  const $counter1 = createStore(0, { name: 'counter1' })
  persist({ store: $counter1, adapter: asyncStorageAdapter })
  await timeout(0)
  expect(await mockAsyncStorage.getItem('counter1')).toBe(null)
  expect($counter1.getState()).toBe(0)
})

it('store new value should be saved to storage', async () => {
  const $counter2 = createStore(0, { name: 'counter2' })
  persist({ store: $counter2, adapter: asyncStorageAdapter })
  await timeout(0)
  expect(await mockAsyncStorage.getItem('counter2')).toBe(null)
  ;($counter2 as any).setState(3)
  await timeout(0)
  expect(await mockAsyncStorage.getItem('counter2')).toBe('3')
  expect($counter2.getState()).toBe(
    JSON.parse((await mockAsyncStorage.getItem('counter2')) as any)
  )
})

it('key should have precedence over name', async () => {
  const $namekey = createStore(0, { name: 'precedence::name' })
  persist({
    store: $namekey,
    adapter: asyncStorageAdapter,
    key: 'precedence::key',
  })
  await timeout(0)
  expect(await mockAsyncStorage.getItem('precedence::name')).toBe(null)
  expect(await mockAsyncStorage.getItem('precedence::key')).toBe(null)
  ;($namekey as any).setState(42)
  await timeout(0)
  expect(await mockAsyncStorage.getItem('precedence::name')).toBe(null)
  expect(await mockAsyncStorage.getItem('precedence::key')).toBe('42')
})

it('store should be initialized from storage value', async () => {
  await mockAsyncStorage.setItem('counter3', '42')
  const $counter3 = createStore(0, { name: 'counter3' })
  persist({ store: $counter3, adapter: asyncStorageAdapter })
  await timeout(0)
  expect(await mockAsyncStorage.getItem('counter3')).toBe('42')
  expect($counter3.getState()).toBe(42)
})

it('reset store should reset it to given initial value', async () => {
  await mockAsyncStorage.setItem('counter4', '42')
  const reset = createEvent()
  const $counter4 = createStore(0, { name: 'counter4' }).reset(reset)
  persist({ store: $counter4, adapter: asyncStorageAdapter })
  await timeout(0)
  expect(await mockAsyncStorage.getItem('counter4')).toBe('42')
  expect($counter4.getState()).toBe(42)
  reset()
  await timeout(0)
  expect(await mockAsyncStorage.getItem('counter4')).toBe('0')
  expect($counter4.getState()).toBe(0)
})

it('broken storage value should be ignored', async () => {
  const error = vi.fn()
  const consoleError = console.error
  console.error = error

  try {
    await mockAsyncStorage.setItem('counter5', 'broken')
    const $counter5 = createStore(13, { name: 'counter5' })
    persist({ store: $counter5, adapter: asyncStorageAdapter })
    await timeout(0)
    expect(await mockAsyncStorage.getItem('counter5')).toBe('broken')
    expect($counter5.getState()).toBe(13)

    expect(error).toHaveBeenCalledTimes(1)
    expect(error.mock.calls[0][0]).toBeInstanceOf(SyntaxError)
  } finally {
    console.error = consoleError
  }
})

it('broken storage value should launch `catch` handler', async () => {
  const handler = createEvent<any>()
  const watch = vi.fn()
  handler.watch(watch)

  await mockAsyncStorage.setItem('counter6', 'broken')
  const $counter6 = createStore(13, { name: 'counter6' })
  persist({ store: $counter6, adapter: asyncStorageAdapter, fail: handler })
  await timeout(0)

  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0].length).toBe(1)

  const { error, ...args } = watch.mock.calls[0][0]
  expect(args).toEqual({
    key: 'counter6',
    keyPrefix: '',
    operation: 'get',
    value: undefined,
  })
  expect(error).toBeInstanceOf(SyntaxError)

  expect(await mockAsyncStorage.getItem('counter6')).toBe('broken')
  expect($counter6.getState()).toBe(13)
})

it('should not fail if error handler is absent', async () => {
  const error = vi.fn()
  const consoleError = console.error
  console.error = error

  try {
    const $store0 = createStore({ test: 1 }, { name: 'store0' })
    persist({ store: $store0, adapter: asyncStorageAdapter })
    await timeout(0)

    expect(await mockAsyncStorage.getItem('store0')).toBe(null)

    const recursive = {}
    ;(recursive as any).recursive = recursive
    ;($store0 as any).setState(recursive)
    await timeout(0)

    expect(await mockAsyncStorage.getItem('store0')).toBe(null)
    expect($store0.getState()).toBe(recursive)

    expect(error).toHaveBeenCalledTimes(1)
    expect(error.mock.calls[0][0]).toBeInstanceOf(TypeError)
  } finally {
    console.error = consoleError
  }
})

it('broken store value should launch `catch` handler', async () => {
  const handler = createEvent<any>()
  const watch = vi.fn()
  handler.watch(watch)

  const $store1 = createStore({ test: 1 }, { name: 'store1' })
  persist({ store: $store1, adapter: asyncStorageAdapter, fail: handler })
  await timeout(0)

  expect(await mockAsyncStorage.getItem('store1')).toBe(null)
  expect($store1.getState()).toEqual({ test: 1 })

  const recursive = {}
  ;(recursive as any).recursive = recursive
  ;($store1 as any).setState(recursive)
  await timeout(0)

  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0].length).toBe(1)

  const { error, ...args } = watch.mock.calls[0][0]
  expect(args).toEqual({
    key: 'store1',
    keyPrefix: '',
    operation: 'set',
    value: recursive,
  })
  expect(error).toBeInstanceOf(TypeError)

  expect(await mockAsyncStorage.getItem('store1')).toBe(null)
  expect($store1.getState()).toBe(recursive)
})

it('different storage instances should not interfere', async () => {
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

  expect(await mockStorage1.getItem('custom')).toBe('111')
  expect(await mockStorage2.getItem('custom')).toBe('222')
  expect($counter1.getState()).toBe(111)
  ;($counter1 as any).setState(333)
  await timeout(0)
  expect(await mockStorage1.getItem('custom')).toBe('333')
  expect(await mockStorage2.getItem('custom')).toBe('222')
  expect($counter1.getState()).toBe(
    JSON.parse((await mockStorage1.getItem('custom')) as any)
  )
  ;($counter2 as any).setState(444)
  await timeout(0)
  expect(await mockStorage1.getItem('custom')).toBe('333')
  expect(await mockStorage2.getItem('custom')).toBe('444')
  expect($counter2.getState()).toBe(
    JSON.parse((await mockStorage2.getItem('custom')) as any)
  )
})

it('should be possible to use custom serialization', async () => {
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

  expect(await mockStorage.getItem('date')).toBe('473684400000')
  expect($date.getState().toISOString()).toBe('1985-01-04T11:00:00.000Z')
  ;($date as any).setState(new Date('1999-02-04T10:00:00.000Z'))
  await timeout(0)
  expect(await mockStorage.getItem('date')).toBe('918122400000')
})

it('should be possible to persist part of the store', async () => {
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

  expect($coords.getState()).toEqual({ x: 42, y: 24 })
  setX(25)

  await timeout(0)

  expect($coords.getState()).toEqual({ x: 25, y: 24 })
  expect(await mockAsyncStorage.getItem('part::x')).toBe('25')
  expect(await mockAsyncStorage.getItem('part::y')).toBe('24')
})

it('should sync stores, persisted to the same adapter-key, but different adapters', async () => {
  const watch = vi.fn()

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
  $store0.watch(watch)
  $store1.watch(watch)

  expect($store0.getState()).toBe(1)
  expect($store1.getState()).toBe(2)
  expect(watch).toHaveBeenCalledTimes(2)
  expect(watch).toHaveBeenNthCalledWith(1, 1)
  expect(watch).toHaveBeenNthCalledWith(2, 2)

  persist({ store: $store0, adapter: adapter1, key: 'same-key-1' })
  persist({ store: $store1, adapter: adapter2, key: 'same-key-1' })

  await timeout(0)

  expect($store0.getState()).toBe(0)
  expect($store1.getState()).toBe(0)
  expect(watch).toHaveBeenCalledTimes(4)
  expect(watch).toHaveBeenNthCalledWith(3, 0)
  expect(watch).toHaveBeenNthCalledWith(4, 0)

  //
  ;($store0 as any).setState(3)
  await timeout(0)

  expect($store0.getState()).toBe(3)
  expect($store1.getState()).toBe(3) // <- also changes
  expect(watch).toHaveBeenCalledTimes(6)
  expect(watch).toHaveBeenNthCalledWith(5, 3)
  expect(watch).toHaveBeenNthCalledWith(6, 3)
})

it('should not throw on storage access error', async () => {
  const watch = vi.fn()
  const fail = createEvent<any>()
  fail.watch(watch)

  const $storex = createStore(0, { name: 'counterx' })

  const throwAdapter = asyncStorage({
    storage() {
      throw new Error('Access denied')
    },
  })

  expect(() =>
    persist({ store: $storex, adapter: throwAdapter, fail })
  ).not.toThrow()

  await timeout(0)

  expect(watch).toHaveBeenCalledTimes(1)
  const { error, ...args } = watch.mock.calls[0][0]
  expect(args).toEqual({
    key: 'counterx',
    keyPrefix: '',
    operation: 'get',
    value: undefined,
  })
  expect(error).toBeInstanceOf(Error)
  expect(error.message).toMatch(/Access denied/)
})
