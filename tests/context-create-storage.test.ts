import type { StorageAdapter } from '../src/types'
import { test, mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { createStore, createEvent, fork, allSettled } from 'effector'
import { createStorage } from '../src'

//
// Tests
//

test('context store value should be passed to adapter', async () => {
  const watch = mock.fn()

  const context = createEvent<number>()

  const { getFx, setFx } = createStorage('test-context-1', {
    adapter: () => ({ get: watch, set: watch }),
    context: createStore(42).on(context, (_, ctx) => ctx),
  })

  getFx()

  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [undefined, 42])

  setFx(54)

  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[1].arguments, [54, 42])

  // update context
  context(72)

  getFx()

  assert.strictEqual(watch.mock.callCount(), 3)
  assert.deepEqual(watch.mock.calls[2].arguments, [undefined, 72])

  setFx(27)

  assert.strictEqual(watch.mock.callCount(), 4)
  assert.deepEqual(watch.mock.calls[3].arguments, [27, 72])
})

test('context event value should be passed to adapter', async () => {
  const watch = mock.fn()

  const context = createEvent<string>()

  const { getFx, setFx } = createStorage('test-context-2', {
    adapter: () => ({ get: watch, set: watch }),
    context,
  })

  getFx()

  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [undefined, undefined])

  setFx(54)

  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[1].arguments, [54, undefined])

  // update context
  context('new context')

  getFx()

  assert.strictEqual(watch.mock.callCount(), 3)
  assert.deepEqual(watch.mock.calls[2].arguments, [undefined, 'new context'])

  setFx(27)

  assert.strictEqual(watch.mock.callCount(), 4)
  assert.deepEqual(watch.mock.calls[3].arguments, [27, 'new context'])
})

test('contexts in different scopes should be different', async () => {
  const watch = mock.fn()

  const context = createEvent<{ name: string }>()

  const { getFx, setFx } = createStorage('test-context-3', {
    adapter: () => ({ get: watch, set: watch }),
    context,
  })

  const scopeA = fork()
  const scopeB = fork()

  await allSettled(context, { scope: scopeA, params: { name: 'scopeA' } })
  await allSettled(context, { scope: scopeB, params: { name: 'scopeB' } })

  await allSettled(getFx, { scope: scopeA })
  await allSettled(getFx, { scope: scopeB })

  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[0].arguments, [
    undefined,
    { name: 'scopeA' },
  ])
  assert.deepEqual(watch.mock.calls[1].arguments, [
    undefined,
    { name: 'scopeB' },
  ])

  await allSettled(setFx, { scope: scopeA, params: 'A' })
  await allSettled(setFx, { scope: scopeB, params: 'B' })

  assert.strictEqual(watch.mock.callCount(), 4)
  assert.deepEqual(watch.mock.calls[2].arguments, ['A', { name: 'scopeA' }])
  assert.deepEqual(watch.mock.calls[3].arguments, ['B', { name: 'scopeB' }])
})

test('context should change scope for async adapter', async () => {
  const watch = mock.fn((value) => value)

  const updated = createEvent<string>()
  const context = createEvent<string>()

  createStorage('test-context-4', {
    context,
    adapter: (_key, update) => {
      updated.watch(update)
      return { get: watch, set: watch }
    },
  })

  updated('out of scope') // <- imitate external storage update

  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, ['out of scope', undefined])

  const scope = fork()

  // set context, which should bind given scope
  await allSettled(context, { scope, params: 'in scope' })

  updated('in scope') // <- pickup new value, within scope

  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[1].arguments, ['in scope', 'in scope'])
})

test('contexts should update scope / also works with adapter factory', async () => {
  const queue = new EventTarget()

  adapterFactory.factory = true as const
  function adapterFactory() {
    const adapter: StorageAdapter = <State>(
      _key: string,
      update: (raw?: any) => void
    ) => {
      let value = 1 as State
      queue.addEventListener('update', () => update((value = 2 as State)))
      return {
        get: () => value,
        set: (x: State) => void (value = x),
      }
    }
    return adapter
  }

  const context = createEvent()

  const { getFx } = createStorage('test-context-4', {
    adapter: adapterFactory,
    context,
    contract: (raw: unknown): raw is number => typeof raw === 'number',
  })

  const $store = createStore(0).on(getFx.doneData, (_, data) => data)

  const scope = fork()

  queue.dispatchEvent(new Event('update'))

  assert.strictEqual($store.getState(), 2) // <- changed
  assert.strictEqual(scope.getState($store), 0) // <- default value

  await allSettled(context, { scope })

  queue.dispatchEvent(new Event('update'))

  assert.strictEqual($store.getState(), 2)
  assert.strictEqual(scope.getState($store), 2) // <- changed in scope
})
