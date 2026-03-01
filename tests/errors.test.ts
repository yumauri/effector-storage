import type { StorageAdapter } from '../src/types'
import { createEvent, createStore } from 'effector'
import { expect, it, vi } from 'vitest'
import { persist } from '../src/core'

//
// Error fake adapters
//

const syncErrorAdapter: StorageAdapter = () => ({
  get: (): never => {
    throw 'get'
  },
  set: (): never => {
    throw 'set'
  },
})

const asyncErrorAdapter: StorageAdapter = (_, update) => {
  setTimeout(update, 10)
  return {
    get: () => Promise.reject('get'),
    set: () => Promise.reject('set'),
  }
}

//
// Tests
//

it('should fire error handler on sync errors', () => {
  const watch = vi.fn()

  const error = createEvent<any>()
  error.watch(watch)

  const $store = createStore(0)
  persist({
    store: $store,
    adapter: syncErrorAdapter,
    key: 'key-1',
    fail: error,
  })

  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0]).toEqual([
    {
      key: 'key-1',
      keyPrefix: '',
      operation: 'get',
      error: 'get',
      value: undefined,
    },
  ])

  //
  ;($store as any).setState(1)
  expect(watch).toHaveBeenCalledTimes(2)
  expect(watch.mock.calls[1]).toEqual([
    {
      key: 'key-1',
      keyPrefix: '',
      operation: 'set',
      error: 'set',
      value: 1,
    },
  ])
})

it('should fire finally handler on sync errors', () => {
  const consoleError = console.error
  console.error = () => undefined

  try {
    const watch = vi.fn()

    const anyway = createEvent<any>()
    anyway.watch(watch)

    const $store = createStore(0)
    persist({
      store: $store,
      adapter: syncErrorAdapter,
      key: 'new-key-1',
      finally: anyway,
    })

    expect(watch).toHaveBeenCalledTimes(1)
    expect(watch.mock.calls[0]).toEqual([
      {
        status: 'fail',
        key: 'new-key-1',
        keyPrefix: '',
        operation: 'get',
        error: 'get',
        value: undefined,
      },
    ])

    //
    ;($store as any).setState(2)
    expect(watch).toHaveBeenCalledTimes(2)
    expect(watch.mock.calls[1]).toEqual([
      {
        status: 'fail',
        key: 'new-key-1',
        keyPrefix: '',
        operation: 'set',
        error: 'set',
        value: 2,
      },
    ])
  } finally {
    console.error = consoleError
  }
})

it('should fire error handler on async errors', async () => {
  const watch = vi.fn()

  const error = createEvent<any>()
  error.watch(watch)

  const $store = createStore(0)
  persist({
    store: $store,
    adapter: asyncErrorAdapter,
    key: 'key-2',
    fail: error,
  })
  expect(watch).toHaveBeenCalledTimes(0)

  await Promise.resolve()
  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0]).toEqual([
    {
      key: 'key-2',
      keyPrefix: '',
      operation: 'get',
      error: 'get',
      value: undefined,
    },
  ])

  //
  ;($store as any).setState(3)
  expect(watch).toHaveBeenCalledTimes(1)

  await Promise.resolve()

  expect(watch).toHaveBeenCalledTimes(2)
  expect(watch.mock.calls[1]).toEqual([
    {
      key: 'key-2',
      keyPrefix: '',
      operation: 'set',
      error: 'set',
      value: 3,
    },
  ])

  await new Promise((resolve) => setTimeout(resolve, 20))
  expect(watch).toHaveBeenCalledTimes(3)
  expect(watch.mock.calls[2]).toEqual([
    {
      key: 'key-2',
      keyPrefix: '',
      operation: 'get',
      error: 'get',
      value: undefined,
    },
  ])
})

it('should fire finally handler on async errors', async () => {
  const consoleError = console.error
  console.error = () => undefined

  try {
    const watch = vi.fn()

    const anyway = createEvent<any>()
    anyway.watch(watch)

    const $store = createStore(0)
    persist({
      store: $store,
      adapter: asyncErrorAdapter,
      key: 'new-key-2',
      finally: anyway,
    })
    expect(watch).toHaveBeenCalledTimes(0)

    await Promise.resolve()
    expect(watch).toHaveBeenCalledTimes(1)
    expect(watch.mock.calls[0]).toEqual([
      {
        status: 'fail',
        key: 'new-key-2',
        keyPrefix: '',
        operation: 'get',
        error: 'get',
        value: undefined,
      },
    ])

    //
    ;($store as any).setState(4)
    expect(watch).toHaveBeenCalledTimes(1)

    await Promise.resolve()

    expect(watch).toHaveBeenCalledTimes(2)
    expect(watch.mock.calls[1]).toEqual([
      {
        status: 'fail',
        key: 'new-key-2',
        keyPrefix: '',
        operation: 'set',
        error: 'set',
        value: 4,
      },
    ])

    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(watch).toHaveBeenCalledTimes(3)
    expect(watch.mock.calls[2]).toEqual([
      {
        status: 'fail',
        key: 'new-key-2',
        keyPrefix: '',
        operation: 'get',
        error: 'get',
        value: undefined,
      },
    ])
  } finally {
    console.error = consoleError
  }
})

it('should not fire error handler on unsubscribed store', async () => {
  const watch = vi.fn()

  const error = createEvent<any>()
  error.watch(watch)

  const $store = createStore(0)
  const unsubscribe = persist({
    store: $store,
    adapter: asyncErrorAdapter,
    key: 'key-3',
    fail: error,
  })
  expect(watch).toHaveBeenCalledTimes(0)

  unsubscribe()

  await new Promise((resolve) => setTimeout(resolve, 20))
  expect(watch).toHaveBeenCalledTimes(0) // <- still zero
})

it('unhandled error should be printed to console.error', () => {
  const error = vi.fn()
  const consoleError = console.error
  console.error = error

  try {
    const $store = createStore(0)
    persist({ store: $store, adapter: syncErrorAdapter, key: 'key-1' })

    expect(error).toHaveBeenCalledTimes(1)
    expect(error.mock.calls[0]).toEqual(['get'])

    //
    ;($store as any).setState(5)
    expect(error).toHaveBeenCalledTimes(2)
    expect(error.mock.calls[1]).toEqual(['set'])
  } finally {
    console.error = consoleError
  }
})
