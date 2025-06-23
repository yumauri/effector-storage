import type { StorageAdapter } from '../src/types'
import { test, mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { createEvent, createStore } from 'effector'
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

test('should fire error handler on sync errors', () => {
  const watch = mock.fn()

  const error = createEvent<any>()
  error.watch(watch)

  const $store = createStore(0)
  persist({
    store: $store,
    adapter: syncErrorAdapter,
    key: 'key-1',
    fail: error,
  })

  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [
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
  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[1].arguments, [
    {
      key: 'key-1',
      keyPrefix: '',
      operation: 'set',
      error: 'set',
      value: 1,
    },
  ])
})

test('should fire finally handler on sync errors', () => {
  const consoleError = console.error
  console.error = () => undefined

  try {
    const watch = mock.fn()

    const anyway = createEvent<any>()
    anyway.watch(watch)

    const $store = createStore(0)
    persist({
      store: $store,
      adapter: syncErrorAdapter,
      key: 'new-key-1',
      finally: anyway,
    })

    assert.strictEqual(watch.mock.callCount(), 1)
    assert.deepEqual(watch.mock.calls[0].arguments, [
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
    assert.strictEqual(watch.mock.callCount(), 2)
    assert.deepEqual(watch.mock.calls[1].arguments, [
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

test('should fire error handler on async errors', async () => {
  const watch = mock.fn()

  const error = createEvent<any>()
  error.watch(watch)

  const $store = createStore(0)
  persist({
    store: $store,
    adapter: asyncErrorAdapter,
    key: 'key-2',
    fail: error,
  })
  assert.strictEqual(watch.mock.callCount(), 0)

  await Promise.resolve()
  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [
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
  assert.strictEqual(watch.mock.callCount(), 1)

  await Promise.resolve()

  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[1].arguments, [
    {
      key: 'key-2',
      keyPrefix: '',
      operation: 'set',
      error: 'set',
      value: 3,
    },
  ])

  await new Promise((resolve) => setTimeout(resolve, 20))
  assert.strictEqual(watch.mock.callCount(), 3)
  assert.deepEqual(watch.mock.calls[2].arguments, [
    {
      key: 'key-2',
      keyPrefix: '',
      operation: 'get',
      error: 'get',
      value: undefined,
    },
  ])
})

test('should fire finally handler on async errors', async () => {
  const consoleError = console.error
  console.error = () => undefined

  try {
    const watch = mock.fn()

    const anyway = createEvent<any>()
    anyway.watch(watch)

    const $store = createStore(0)
    persist({
      store: $store,
      adapter: asyncErrorAdapter,
      key: 'new-key-2',
      finally: anyway,
    })
    assert.strictEqual(watch.mock.callCount(), 0)

    await Promise.resolve()
    assert.strictEqual(watch.mock.callCount(), 1)
    assert.deepEqual(watch.mock.calls[0].arguments, [
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
    assert.strictEqual(watch.mock.callCount(), 1)

    await Promise.resolve()

    assert.strictEqual(watch.mock.callCount(), 2)
    assert.deepEqual(watch.mock.calls[1].arguments, [
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
    assert.strictEqual(watch.mock.callCount(), 3)
    assert.deepEqual(watch.mock.calls[2].arguments, [
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

test('should not fire error handler on unsubscribed store', async () => {
  const watch = mock.fn()

  const error = createEvent<any>()
  error.watch(watch)

  const $store = createStore(0)
  const unsubscribe = persist({
    store: $store,
    adapter: asyncErrorAdapter,
    key: 'key-3',
    fail: error,
  })
  assert.strictEqual(watch.mock.callCount(), 0)

  unsubscribe()

  await new Promise((resolve) => setTimeout(resolve, 20))
  assert.strictEqual(watch.mock.callCount(), 0) // <- still zero
})

test('unhandled error should be printed to console.error', () => {
  const error = mock.fn()
  const consoleError = console.error
  console.error = error

  try {
    const $store = createStore(0)
    persist({ store: $store, adapter: syncErrorAdapter, key: 'key-1' })

    assert.strictEqual(error.mock.callCount(), 1)
    assert.deepEqual(error.mock.calls[0].arguments, ['get'])

    //
    ;($store as any).setState(5)
    assert.strictEqual(error.mock.callCount(), 2)
    assert.deepEqual(error.mock.calls[1].arguments, ['set'])
  } finally {
    console.error = consoleError
  }
})
