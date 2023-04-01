import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore, createEvent, fork, allSettled, launch } from 'effector'
import { persist } from '../src/core'

//
// Tests
//

test('context from pickup should be passed to adapter', async () => {
  const watch = snoop((_value, _ctx) => undefined as any) // eslint-disable-line @typescript-eslint/no-unused-vars

  const pickup = createEvent<number>()
  const $store = createStore(0)

  persist({
    store: $store,
    pickup,
    adapter: () => ({ get: watch.fn, set: watch.fn }),
    key: 'store',
  })

  pickup(42) // <- pick up new value with context `42`

  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [undefined, 42])

  //
  ;($store as any).setState(54) // <- update store to trigger `get`

  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[1].arguments, [54, 42])
})

test('context from context should be passed to adapter', async () => {
  const watch = snoop((_value, _ctx) => undefined as any) // eslint-disable-line @typescript-eslint/no-unused-vars

  const context = createEvent<string>()
  const $store = createStore(0)

  persist({
    store: $store,
    context,
    adapter: () => ({ get: watch.fn, set: watch.fn }),
    key: 'store',
  })

  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [undefined, undefined])

  //
  ;($store as any).setState(72) // <- update store to trigger `get`

  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[1].arguments, [72, undefined])

  context('new context')

  assert.is(watch.callCount, 2) // setting context does not call any adapter methods

  //
  ;($store as any).setState(27) // <- update store to trigger `get`

  assert.is(watch.callCount, 3)
  assert.equal(watch.calls[2].arguments, [27, 'new context'])
})

test('pickup should set different contexts in different scopes', async () => {
  const watch = snoop((_value, _ctx) => undefined as any) // eslint-disable-line @typescript-eslint/no-unused-vars

  const pickup = createEvent<{ name: string }>()
  const $store = createStore('')

  persist({
    store: $store,
    pickup,
    adapter: () => ({ get: watch.fn, set: watch.fn }),
    key: 'store',
  })

  const scopeA = fork()
  const scopeB = fork()

  await allSettled(pickup, { scope: scopeA, params: { name: 'scopeA' } })
  await allSettled(pickup, { scope: scopeB, params: { name: 'scopeB' } })

  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[0].arguments, [undefined, { name: 'scopeA' }])
  assert.equal(watch.calls[1].arguments, [undefined, { name: 'scopeB' }])

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

  assert.is(watch.callCount, 4)
  assert.equal(watch.calls[2].arguments, ['A', { name: 'scopeA' }])
  assert.equal(watch.calls[3].arguments, ['B', { name: 'scopeB' }])
})

test('context should change scope for async adapter', async () => {
  const watch = snoop((value, _ctx) => value) // eslint-disable-line @typescript-eslint/no-unused-vars

  const pickup = createEvent<string>()
  const context = createEvent()
  const $store = createStore('')

  persist({
    store: $store,
    context,
    adapter: (_key, update) => {
      pickup.watch(update)
      return { get: watch.fn, set: watch.fn }
    },
    key: 'store',
  })

  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [undefined, undefined])

  const scope = fork()

  assert.is($store.getState(), '')
  assert.is(scope.getState($store), '')

  pickup('out of scope') // <- pickup new value, without scope

  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[1].arguments, ['out of scope', undefined])
  assert.is($store.getState(), 'out of scope')
  assert.is(scope.getState($store), '')

  // set context, which should bind given scope
  await allSettled(context, { scope })

  pickup('in scope') // <- pickup new value, within scope

  assert.is(watch.callCount, 3)
  assert.equal(watch.calls[2].arguments, ['in scope', undefined])
  assert.is($store.getState(), 'out of scope')
  assert.is(scope.getState($store), 'in scope')
})

//
// Launch tests
//

test.run()
