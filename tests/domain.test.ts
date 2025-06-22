import type { StorageAdapter } from '../src/types'
import { test, mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { createStore, createDomain } from 'effector'
import { persist } from '../src/core'

//
// Dumb fake adapter
//

const dumbAdapter: StorageAdapter = <T>() => {
  let __: T = 0 as any
  return {
    get: (): T => __,
    set: (value: T) => void (__ = value),
  }
}

//
// Tests
//

test('should call watcher twice', () => {
  const watch = mock.fn()

  const $store = createStore(1)
  $store.watch(watch)

  persist({ store: $store, adapter: dumbAdapter, key: 'domain::store0' })

  assert.strictEqual($store.getState(), 0)
  assert.strictEqual($store.defaultState, 1)

  // call watcher twice
  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[0].arguments, [1])
  assert.deepEqual(watch.mock.calls[1].arguments, [0])
})

test('should call watcher once if persisted in domain hook', () => {
  const watch = mock.fn()
  const root = createDomain()

  root.onCreateStore((store) => {
    persist({ store, adapter: dumbAdapter })
  })

  const $store = root.createStore(1, { name: 'domain::store1' })
  $store.watch(watch)

  assert.strictEqual($store.getState(), 0)
  assert.strictEqual($store.defaultState, 1)

  // call watcher once
  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [0])
})

test('should throw error in case of missing name in named domain', async () => {
  const root = createDomain('root')

  let rs: any
  let rj: any
  const defer = new Promise((resolve, reject) => {
    rs = resolve
    rj = reject
  })

  root.onCreateStore((store) => {
    try {
      persist({ store, adapter: dumbAdapter })
      rs()
    } catch (err) {
      rj(err)
    }
  })

  root.createStore(1)

  try {
    await defer
    assert.fail()
  } catch (err) {
    assert.ok(err instanceof Error)
    assert.match(err.message, /Key or name is not defined/)
  }
})
