import type { StorageAdapter } from '../src/types'
import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { type Snoop, snoop } from 'snoop'
import {
  version,
  createStore,
  createEvent,
  fork,
  allSettled,
  serialize,
} from 'effector'
import { persist } from '../src/core'

//
// Effector version guard
//

let warn = true
function old() {
  if (version < '22.3') {
    if (warn) {
      console.log('// skip scope serialize tests due to old effector version')
      warn = false
    }
    return true
  }
  return false
}

//
// Dumb fake adapter
//

const dumbAdapter: StorageAdapter = <T>() => {
  let __: T = 42 as any
  return {
    get: (): T => __,
    set: (value: T) => (__ = value),
  }
}

//
// Mock console.error to catch serialize warning
//

type ErrorFn = typeof console.error
type MockErrorFn = Snoop<ErrorFn>
let errorFn: ErrorFn

test.before.each(() => {
  errorFn = console.error
  const mock = snoop(() => undefined)
  console.error = mock.fn
  ;(console.error as any).mock = mock
})

test.after.each(() => {
  console.error = errorFn
})

//
// Tests
//

test('store without sid should warn', async () => {
  if (old()) return

  const fn: MockErrorFn = (console.error as any).mock

  const event = createEvent()
  createStore(0).on(event, () => 42)

  // @ts-expect-error due to old typings in import
  const scope = fork()
  // @ts-expect-error due to old typings in import
  await allSettled(event, { scope })

  serialize(scope)

  assert.equal(fn.calls[0]?.arguments, [
    'There is a store without sid in this scope, its value is omitted',
  ])
  assert.is(fn.callCount, 1)
})

test('store with sid should not warn', async () => {
  if (old()) return

  const fn: MockErrorFn = (console.error as any).mock

  const event = createEvent()
  createStore(0, { sid: 'x' }).on(event, () => 42)

  // @ts-expect-error due to old typings in import
  const scope = fork()
  // @ts-expect-error due to old typings in import
  await allSettled(event, { scope })

  serialize(scope)

  assert.equal(fn.calls[0]?.arguments, undefined)
  assert.is(fn.callCount, 0)
})

test('not serializable store should not warn', async () => {
  if (old()) return

  const fn: MockErrorFn = (console.error as any).mock

  const event = createEvent()
  // @ts-expect-error due to old typings in import
  createStore(0, { serialize: 'ignore' }).on(event, () => 42)

  // @ts-expect-error due to old typings in import
  const scope = fork()
  // @ts-expect-error due to old typings in import
  await allSettled(event, { scope })

  serialize(scope)

  assert.equal(fn.calls[0]?.arguments, undefined)
  assert.is(fn.callCount, 0)
})

test('persist usage should not warn', async () => {
  if (old()) return

  const fn: MockErrorFn = (console.error as any).mock

  const event = createEvent()
  const $store = createStore(0, { sid: 'x' })

  persist({
    store: $store,
    pickup: event,
    adapter: dumbAdapter,
    key: 'store',
  })

  // do not pickup value from adapter until `pickup` is triggered
  assert.is($store.getState(), 0)

  // @ts-expect-error due to old typings in import
  const scope = fork()
  // @ts-expect-error due to old typings in import
  await allSettled(event, { scope })

  // should fill scoped store value
  assert.is(scope.getState($store), 42)
  assert.is($store.getState(), 0)

  serialize(scope)

  assert.equal(fn.calls[0]?.arguments, undefined)
  assert.is(fn.callCount, 0)
})

//
// Launch tests
//

test.run()
