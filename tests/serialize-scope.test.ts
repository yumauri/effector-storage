import type { StorageAdapter } from '../src/types'
import { test, beforeEach, afterEach, mock, type Mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { createStore, createEvent, fork, allSettled, serialize } from 'effector'
import { persist } from '../src/core'

//
// Dumb fake adapter
//

const dumbAdapter: StorageAdapter = <T>() => {
  let __: T = 42 as any
  return {
    get: (): T => __,
    set: (value: T) => void (__ = value),
  }
}

//
// Mock console.error to catch serialize warning
//

type ErrorFn = typeof console.error
let errorFn: ErrorFn

beforeEach(() => {
  errorFn = console.error
  const error = mock.fn()
  console.error = error
})

afterEach(() => {
  console.error = errorFn
})

//
// Tests
//

test('store without sid should warn', async () => {
  const fn = (console.error as Mock<ErrorFn>).mock

  const event = createEvent()
  createStore(0).on(event, () => 42)

  const scope = fork()
  await allSettled(event, { scope })

  serialize(scope)

  // error message prior to effector 23.3.0
  const oldMsg =
    'There is a store without sid in this scope, its value is omitted'

  // error message after effector 23.3.0
  const newMsg =
    'serialize: One or more stores dont have sids, their values are omitted'

  assert.strictEqual(fn.calls[0]?.arguments.length, 1)
  const msg = fn.calls[0]?.arguments[0]
  assert.ok(msg === oldMsg || msg === newMsg)

  // in effector after 23.3.0, there are two calls to console.error
  assert.strictEqual(fn.callCount(), msg === oldMsg ? 1 : 2)
})

test('store with sid should not warn', async () => {
  const fn = (console.error as Mock<ErrorFn>).mock

  const event = createEvent()
  createStore(0, { sid: 'x' }).on(event, () => 42)

  const scope = fork()
  await allSettled(event, { scope })

  serialize(scope)

  assert.deepEqual(fn.calls[0]?.arguments, undefined)
  assert.strictEqual(fn.callCount(), 0)
})

test('not serializable store should not warn', async () => {
  const fn = (console.error as Mock<ErrorFn>).mock

  const event = createEvent()
  createStore(0, { serialize: 'ignore' }).on(event, () => 42)

  const scope = fork()
  await allSettled(event, { scope })

  serialize(scope)

  assert.deepEqual(fn.calls[0]?.arguments, undefined)
  assert.strictEqual(fn.callCount(), 0)
})

test('persist usage should not warn', async () => {
  const fn = (console.error as Mock<ErrorFn>).mock

  const event = createEvent()
  const $store = createStore(0, { sid: 'x' })

  persist({
    store: $store,
    pickup: event,
    adapter: dumbAdapter,
    key: 'store',
  })

  // do not pickup value from adapter until `pickup` is triggered
  assert.strictEqual($store.getState(), 0)

  const scope = fork()
  await allSettled(event, { scope })

  // should fill scoped store value
  assert.strictEqual(scope.getState($store), 42)
  assert.strictEqual($store.getState(), 0)

  serialize(scope)

  assert.deepEqual(fn.calls[0]?.arguments, undefined)
  assert.strictEqual(fn.callCount(), 0)
})

test('setting value to persisted store should not warn', async () => {
  const fn = (console.error as Mock<ErrorFn>).mock

  const set = createEvent<number>()
  const pickup = createEvent()
  const $store = createStore(0, { sid: 'y' }).on(set, (_, x) => x)

  persist({
    store: $store,
    pickup,
    adapter: dumbAdapter,
    key: 'store_y',
  })

  const scope = fork()
  await allSettled(pickup, { scope })
  await allSettled(set, { scope, params: 24 })

  // should fill scoped store value
  assert.strictEqual(scope.getState($store), 24)
  assert.strictEqual($store.getState(), 0)

  serialize(scope)

  assert.deepEqual(fn.calls[0]?.arguments, undefined)
  assert.strictEqual(fn.callCount(), 0)
})
