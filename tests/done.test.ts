import type { StorageAdapter } from '../src/types'
import { test, mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { createEvent, createStore } from 'effector'
import { persist } from '../src/core'

//
// Dumb fake adapter
//

const dumbAdapter: StorageAdapter = <T>() => {
  let __: T = 0 as any
  return {
    get: (): T => __,
    set: (value: T) => {
      __ = value
    },
  }
}

//
// Tests
//

test('should fire done and finally events', () => {
  const watch = mock.fn()

  const done = createEvent<any>()
  const anyway = createEvent<any>()
  done.watch(watch)
  anyway.watch(watch)

  const $store = createStore(1)
  persist({
    store: $store,
    adapter: dumbAdapter,
    key: 'test',
    done,
    finally: anyway,
  })

  assert.strictEqual(watch.mock.callCount(), 2)

  // `finally`, get value from storage
  assert.deepEqual(watch.mock.calls[0].arguments, [
    {
      key: 'test',
      keyPrefix: '',
      operation: 'get',
      status: 'done',
      value: 0,
    },
  ])

  // `done`, get value from storage
  assert.deepEqual(watch.mock.calls[1].arguments, [
    {
      key: 'test',
      keyPrefix: '',
      operation: 'get',
      value: 0,
    },
  ])
})

test('should return value on successful `set` operation', () => {
  const watch = mock.fn()

  const done = createEvent<any>()
  done.watch(watch)

  const $store = createStore(1)
  persist({ store: $store, adapter: dumbAdapter, key: 'test', done })

  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [
    {
      key: 'test',
      keyPrefix: '',
      operation: 'get',
      value: 0,
    },
  ])

  // set new value to store
  ;($store as any).setState(2)

  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[1].arguments, [
    {
      key: 'test',
      keyPrefix: '',
      operation: 'set',
      value: 2,
    },
  ])
})
