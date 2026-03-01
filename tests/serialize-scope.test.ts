import type { StorageAdapter } from '../src/types'
import { it, beforeEach, afterEach, vi, expect } from 'vitest'
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
  const error = vi.fn()
  console.error = error
})

afterEach(() => {
  console.error = errorFn
})

//
// Tests
//

it('store without sid should warn', async () => {
  const fn = vi.mocked(console.error).mock

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

  expect(fn.calls[0]?.length).toBe(1)
  const msg = fn.calls[0]?.[0]
  expect(msg === oldMsg || msg === newMsg).toBeTruthy()

  // in effector after 23.3.0, there are two calls to console.error
  expect(fn.calls.length).toBe(msg === oldMsg ? 1 : 2)
})

it('store with sid should not warn', async () => {
  const fn = vi.mocked(console.error).mock

  const event = createEvent()
  createStore(0, { sid: 'x' }).on(event, () => 42)

  const scope = fork()
  await allSettled(event, { scope })

  serialize(scope)

  expect(fn.calls[0]).toEqual(undefined)
  expect(fn.calls.length).toBe(0)
})

it('not serializable store should not warn', async () => {
  const fn = vi.mocked(console.error).mock

  const event = createEvent()
  createStore(0, { serialize: 'ignore' }).on(event, () => 42)

  const scope = fork()
  await allSettled(event, { scope })

  serialize(scope)

  expect(fn.calls[0]).toEqual(undefined)
  expect(fn.calls.length).toBe(0)
})

it('persist usage should not warn', async () => {
  const fn = vi.mocked(console.error).mock

  const event = createEvent()
  const $store = createStore(0, { sid: 'x' })

  persist({
    store: $store,
    pickup: event,
    adapter: dumbAdapter,
    key: 'store',
  })

  // do not pickup value from adapter until `pickup` is triggered
  expect($store.getState()).toBe(0)

  const scope = fork()
  await allSettled(event, { scope })

  // should fill scoped store value
  expect(scope.getState($store)).toBe(42)
  expect($store.getState()).toBe(0)

  serialize(scope)

  expect(fn.calls[0]).toEqual(undefined)
  expect(fn.calls.length).toBe(0)
})

it('setting value to persisted store should not warn', async () => {
  const fn = vi.mocked(console.error).mock

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
  expect(scope.getState($store)).toBe(24)
  expect($store.getState()).toBe(0)

  serialize(scope)

  expect(fn.calls[0]).toEqual(undefined)
  expect(fn.calls.length).toBe(0)
})
