import { allSettled, createEvent, createStore, fork, launch } from 'effector'
import { expect, it, vi } from 'vitest'
import { persist } from '../src/core'

//
// Tests
//

it('context from pickup should be passed to adapter', async () => {
  const watch = vi.fn()

  const pickup = createEvent<number>()
  const $store = createStore(0)

  persist({
    store: $store,
    pickup,
    adapter: () => ({ get: watch, set: watch }),
    key: 'store',
  })

  pickup(42) // <- pick up new value with context `42`

  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0]).toEqual([undefined, 42])

  //
  ;($store as any).setState(54) // <- update store to trigger `set`

  expect(watch).toHaveBeenCalledTimes(2)
  expect(watch.mock.calls[1]).toEqual([54, 42])
})

it('context from store should be passed to adapter', async () => {
  const watch = vi.fn()

  const $store = createStore(0)

  persist({
    store: $store,
    adapter: () => ({ get: watch, set: watch }),
    key: 'store',
    context: createStore(42),
  })

  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0]).toEqual([undefined, 42])

  //
  ;($store as any).setState(54) // <- update store to trigger `set`

  expect(watch).toHaveBeenCalledTimes(2)
  expect(watch.mock.calls[1]).toEqual([54, 42])
})

it('context from context should be passed to adapter', async () => {
  const watch = vi.fn()

  const context = createEvent<string>()
  const $store = createStore(0)

  persist({
    store: $store,
    context,
    adapter: () => ({ get: watch, set: watch }),
    key: 'store',
  })

  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0]).toEqual([undefined, undefined])

  //
  ;($store as any).setState(72) // <- update store to trigger `set`

  expect(watch).toHaveBeenCalledTimes(2)
  expect(watch.mock.calls[1]).toEqual([72, undefined])

  context('new context')

  expect(watch).toHaveBeenCalledTimes(2) // setting context does not call any adapter methods

  //
  ;($store as any).setState(27) // <- update store to trigger `set`

  expect(watch).toHaveBeenCalledTimes(3)
  expect(watch.mock.calls[2]).toEqual([27, 'new context'])
})

it('pickup should set different contexts in different scopes', async () => {
  const watch = vi.fn()

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

  expect(watch).toHaveBeenCalledTimes(2)
  expect(watch.mock.calls[0]).toEqual([undefined, { name: 'scopeA' }])
  expect(watch.mock.calls[1]).toEqual([undefined, { name: 'scopeB' }])

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

  expect(watch).toHaveBeenCalledTimes(4)
  expect(watch.mock.calls[2]).toEqual(['A', { name: 'scopeA' }])
  expect(watch.mock.calls[3]).toEqual(['B', { name: 'scopeB' }])
})

it('context should change scope for async adapter', async () => {
  const watch = vi.fn((value) => value)

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

  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0]).toEqual([undefined, undefined])

  const scope = fork()

  expect($store.getState()).toBe('')
  expect(scope.getState($store)).toBe('')

  pickup('out of scope') // <- pickup new value, without scope

  expect(watch).toHaveBeenCalledTimes(2)
  expect(watch.mock.calls[1]).toEqual(['out of scope', undefined])
  expect($store.getState()).toBe('out of scope')
  expect(scope.getState($store)).toBe('')

  // set context, which should bind given scope
  await allSettled(context, { scope })

  pickup('in scope') // <- pickup new value, within scope

  expect(watch).toHaveBeenCalledTimes(3)
  expect(watch.mock.calls[2]).toEqual(['in scope', undefined])
  expect($store.getState()).toBe('out of scope')
  expect(scope.getState($store)).toBe('in scope')
})
