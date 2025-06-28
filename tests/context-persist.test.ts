import { test, mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { createStore, createEvent, fork, allSettled, launch } from 'effector'
import { persist } from '../src/core'

//
// Tests
//

test('context from pickup should be passed to adapter', async () => {
  const watch = mock.fn()

  const pickup = createEvent<number>()
  const $store = createStore(0)

  persist({
    store: $store,
    pickup,
    adapter: () => ({ get: watch, set: watch }),
    key: 'store',
  })

  pickup(42) // <- pick up new value with context `42`

  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [undefined, 42])

  //
  ;($store as any).setState(54) // <- update store to trigger `set`

  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[1].arguments, [54, 42])
})

test('context from store should be passed to adapter', async () => {
  const watch = mock.fn()

  const $store = createStore(0)

  persist({
    store: $store,
    adapter: () => ({ get: watch, set: watch }),
    key: 'store',
    context: createStore(42),
  })

  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [undefined, 42])

  //
  ;($store as any).setState(54) // <- update store to trigger `set`

  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[1].arguments, [54, 42])
})

test('context from context should be passed to adapter', async () => {
  const watch = mock.fn()

  const context = createEvent<string>()
  const $store = createStore(0)

  persist({
    store: $store,
    context,
    adapter: () => ({ get: watch, set: watch }),
    key: 'store',
  })

  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [undefined, undefined])

  //
  ;($store as any).setState(72) // <- update store to trigger `set`

  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[1].arguments, [72, undefined])

  context('new context')

  assert.strictEqual(watch.mock.callCount(), 2) // setting context does not call any adapter methods

  //
  ;($store as any).setState(27) // <- update store to trigger `set`

  assert.strictEqual(watch.mock.callCount(), 3)
  assert.deepEqual(watch.mock.calls[2].arguments, [27, 'new context'])
})

test('pickup should set different contexts in different scopes', async () => {
  const watch = mock.fn()

  const pickup = createEvent<{ name: string }>()
  const $store = createStore('')

  persist({
    store: $store,
    pickup,
    adapter: () => ({ get: watch, set: watch }),
    key: 'store',
  })

  const scopeA = fork()
  const scopeB = fork()

  await allSettled(pickup, { scope: scopeA, params: { name: 'scopeA' } })
  await allSettled(pickup, { scope: scopeB, params: { name: 'scopeB' } })

  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[0].arguments, [
    undefined,
    { name: 'scopeA' },
  ])
  assert.deepEqual(watch.mock.calls[1].arguments, [
    undefined,
    { name: 'scopeB' },
  ])

  //
  launch({
    target: $store,
    params: 'A',
    defer: true,
    scope: scopeA,
  })
  launch({
    target: $store,
    params: 'B',
    defer: true,
    scope: scopeB,
  })

  assert.strictEqual(watch.mock.callCount(), 4)
  assert.deepEqual(watch.mock.calls[2].arguments, ['A', { name: 'scopeA' }])
  assert.deepEqual(watch.mock.calls[3].arguments, ['B', { name: 'scopeB' }])
})

test('context should change scope for async adapter', async () => {
  const watch = mock.fn((value) => value)

  const pickup = createEvent<string>()
  const context = createEvent()
  const $store = createStore('')

  persist({
    store: $store,
    context,
    adapter: (_key, update) => {
      pickup.watch(update)
      return { get: watch, set: watch }
    },
    key: 'store',
  })

  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [undefined, undefined])

  const scope = fork()

  assert.strictEqual($store.getState(), '')
  assert.strictEqual(scope.getState($store), '')

  pickup('out of scope') // <- pickup new value, without scope

  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[1].arguments, ['out of scope', undefined])
  assert.strictEqual($store.getState(), 'out of scope')
  assert.strictEqual(scope.getState($store), '')

  // set context, which should bind given scope
  await allSettled(context, { scope })

  pickup('in scope') // <- pickup new value, within scope

  assert.strictEqual(watch.mock.callCount(), 3)
  assert.deepEqual(watch.mock.calls[2].arguments, ['in scope', undefined])
  assert.strictEqual($store.getState(), 'out of scope')
  assert.strictEqual(scope.getState($store), 'in scope')
})
