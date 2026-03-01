import { createEvent, createStore } from 'effector'
import { expect, it, vi } from 'vitest'
import { storage as storageIndex } from '../src'
import { persist } from '../src/core'
import { storage } from '../src/storage'
import { createStorageMock } from './mocks/storage.mock'

//
// Mock abstract Storage adapter
//

const mockStorage = createStorageMock()
const storageAdapter = storage({ storage: () => mockStorage })

//
// Tests
//

it('should be exported from package root', () => {
  expect(storage).toBe(storageIndex)
})

it('store initial value should NOT be saved to storage', () => {
  const $counter1 = createStore(0, { name: 'counter1' })
  persist({ store: $counter1, adapter: storageAdapter })
  expect(mockStorage.getItem('counter1')).toBe(null)
  expect($counter1.getState()).toBe(0)
})

it('store new value should be saved to storage', () => {
  const $counter2 = createStore(0, { name: 'counter2' })
  persist({ store: $counter2, adapter: storageAdapter })
  expect(mockStorage.getItem('counter2')).toBe(null)
  ;($counter2 as any).setState(3)
  expect(mockStorage.getItem('counter2')).toBe('3')
  expect($counter2.getState()).toBe(
    JSON.parse(mockStorage.getItem('counter2') as any)
  )
})

it('key should have precedence over name', () => {
  const $namekey = createStore(0, { name: 'precedence::name' })
  persist({ store: $namekey, adapter: storageAdapter, key: 'precedence::key' })
  expect(mockStorage.getItem('precedence::name')).toBe(null)
  expect(mockStorage.getItem('precedence::key')).toBe(null)
  ;($namekey as any).setState(42)
  expect(mockStorage.getItem('precedence::name')).toBe(null)
  expect(mockStorage.getItem('precedence::key')).toBe('42')
})

it('store should be initialized from storage value', () => {
  mockStorage.setItem('counter3', '42')
  const $counter3 = createStore(0, { name: 'counter3' })
  persist({ store: $counter3, adapter: storageAdapter })
  expect(mockStorage.getItem('counter3')).toBe('42')
  expect($counter3.getState()).toBe(42)
})

it('store should be initialized with default value', () => {
  const $counter31 = createStore(0, { name: 'counter31' })
  const adapter = storage({ storage: () => mockStorage, def: 42 })
  persist({ store: $counter31, adapter })
  expect(mockStorage.getItem('counter31')).toBe(null)
  expect($counter31.getState()).toBe(42)
})

it('store should be initialized from storage value, not default value', () => {
  mockStorage.setItem('counter32', '42')
  const adapter = storage({ storage: () => mockStorage, def: 21 })
  const $counter32 = createStore(0, { name: 'counter32' })
  persist({ store: $counter32, adapter })
  expect(mockStorage.getItem('counter32')).toBe('42')
  expect($counter32.getState()).toBe(42)
})

it('reset store should reset it to given initial value', () => {
  mockStorage.setItem('counter4', '42')
  const reset = createEvent()
  const $counter4 = createStore(0, { name: 'counter4' }).reset(reset)
  persist({ store: $counter4, adapter: storageAdapter })
  expect(mockStorage.getItem('counter4')).toBe('42')
  expect($counter4.getState()).toBe(42)
  reset()
  expect(mockStorage.getItem('counter4')).toBe('0')
  expect($counter4.getState()).toBe(0)
})

it('broken storage value should be ignored', () => {
  const error = vi.fn()
  const consoleError = console.error
  console.error = error

  try {
    mockStorage.setItem('counter5', 'broken')
    const $counter5 = createStore(13, { name: 'counter5' })
    persist({ store: $counter5, adapter: storageAdapter })
    expect(mockStorage.getItem('counter5')).toBe('broken')
    expect($counter5.getState()).toBe(13)

    expect(error).toHaveBeenCalledTimes(1)
    expect(error.mock.calls[0][0]).toBeInstanceOf(SyntaxError)
  } finally {
    console.error = consoleError
  }
})

it('broken storage value should launch `catch` handler', () => {
  const handler = createEvent<any>()
  const watch = vi.fn()
  handler.watch(watch)

  mockStorage.setItem('counter6', 'broken')
  const $counter6 = createStore(13, { name: 'counter6' })
  persist({ store: $counter6, adapter: storageAdapter, fail: handler })

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

  expect(mockStorage.getItem('counter6')).toBe('broken')
  expect($counter6.getState()).toBe(13)
})

it('should not fail if error handler is absent', () => {
  const error = vi.fn()
  const consoleError = console.error
  console.error = error

  try {
    const $store0 = createStore({ test: 1 }, { name: 'store0' })
    persist({ store: $store0, adapter: storageAdapter })

    expect(mockStorage.getItem('store0')).toBe(null)

    const recursive = {}
    ;(recursive as any).recursive = recursive
    ;($store0 as any).setState(recursive)

    expect(mockStorage.getItem('store0')).toBe(null)
    expect($store0.getState()).toBe(recursive)

    expect(error).toHaveBeenCalledTimes(1)
    expect(error.mock.calls[0][0]).toBeInstanceOf(TypeError)
  } finally {
    console.error = consoleError
  }
})

it('broken store value should launch `catch` handler', () => {
  const handler = createEvent<any>()
  const watch = vi.fn()
  handler.watch(watch)

  const $store1 = createStore({ test: 1 }, { name: 'store1' })
  persist({ store: $store1, adapter: storageAdapter, fail: handler })

  expect(mockStorage.getItem('store1')).toBe(null)
  expect($store1.getState()).toEqual({ test: 1 })

  const recursive = {}
  ;(recursive as any).recursive = recursive
  ;($store1 as any).setState(recursive)

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

  expect(mockStorage.getItem('store1')).toBe(null)
  expect($store1.getState()).toBe(recursive)
})

it('different storage instances should not interfere', () => {
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

  expect(mockStorage1.getItem('custom')).toBe('111')
  expect(mockStorage2.getItem('custom')).toBe('222')
  expect($counter1.getState()).toBe(111)
  ;($counter1 as any).setState(333)
  expect(mockStorage1.getItem('custom')).toBe('333')
  expect(mockStorage2.getItem('custom')).toBe('222')
  expect($counter1.getState()).toBe(
    JSON.parse(mockStorage1.getItem('custom') as any)
  )
  ;($counter2 as any).setState(444)
  expect(mockStorage1.getItem('custom')).toBe('333')
  expect(mockStorage2.getItem('custom')).toBe('444')
  expect($counter2.getState()).toBe(
    JSON.parse(mockStorage2.getItem('custom') as any)
  )
})

it('should be possible to use custom serialization', () => {
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

  expect(mockStorage.getItem('date')).toBe('473684400000')
  expect($date.getState().toISOString()).toBe('1985-01-04T11:00:00.000Z')
  ;($date as any).setState(new Date('1999-02-04T10:00:00.000Z'))
  expect(mockStorage.getItem('date')).toBe('918122400000')
})

it('should be possible to persist part of the store', () => {
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

  expect($coords.getState()).toEqual({ x: 42, y: 24 })
  setX(25)
  expect($coords.getState()).toEqual({ x: 25, y: 24 })
  expect(mockStorage.getItem('part::x')).toBe('25')
  expect(mockStorage.getItem('part::y')).toBe('24')
})

it('should sync stores, persisted to the same adapter-key, but different adapters', () => {
  const watch = vi.fn()

  const mockStorage = createStorageMock()
  mockStorage.setItem('same-key-1', '0')

  const adapter1 = storage({ storage: () => mockStorage, sync: false })
  const adapter2 = storage({ storage: () => mockStorage, sync: true })

  const $store0 = createStore(1)
  const $store1 = createStore(2)
  $store0.watch(watch)
  $store1.watch(watch)

  expect($store0.getState()).toBe(1)
  expect($store1.getState()).toBe(2)
  expect(watch).toHaveBeenCalledTimes(2)
  expect(watch.mock.calls[0]).toEqual([1])
  expect(watch.mock.calls[1]).toEqual([2])

  persist({ store: $store0, adapter: adapter1, key: 'same-key-1' })
  persist({ store: $store1, adapter: adapter2, key: 'same-key-1' })

  expect($store0.getState()).toBe(0)
  expect($store1.getState()).toBe(0)
  expect(watch).toHaveBeenCalledTimes(4)
  expect(watch.mock.calls[2]).toEqual([0])
  expect(watch.mock.calls[3]).toEqual([0])

  //
  ;($store0 as any).setState(3)

  expect($store0.getState()).toBe(3)
  expect($store1.getState()).toBe(3) // <- also changes
  expect(watch).toHaveBeenCalledTimes(6)
  expect(watch.mock.calls[4]).toEqual([3])
  expect(watch.mock.calls[5]).toEqual([3])
})
