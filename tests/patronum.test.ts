import type { StorageAdapter } from '../src/types'
import { debounce } from 'patronum/debounce'
import { test, mock, type Mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { createEvent, createStore, sample } from 'effector'
import { persist } from '../src/core'

//
// Fake adapter
//

const createAdapter = (): {
  set: Mock<any>
  get: Mock<any>
  adapter: StorageAdapter
} => {
  const set = mock.fn((value: any) => value)
  const get = mock.fn((_raw: any, value: any) => value)

  const adapter: StorageAdapter = <T>() => {
    let __: T = undefined as any
    return {
      get: (raw: any): T => get(raw, __),
      set: (value: T) => (__ = set(value)),
    }
  }

  return { set, get, adapter }
}

//
// Tests
//

test('storage updates should be debounced', async () => {
  const incrementWatch = mock.fn()
  const debouncedWatch = mock.fn()
  const storeWatch = mock.fn()

  const increment = createEvent()
  increment.watch(incrementWatch)

  const debounced = debounce({ source: increment, timeout: 10 })
  debounced.watch(debouncedWatch)

  const $store = createStore(0, { name: 'debounced' }).on(
    increment,
    (state) => state + 1
  )
  $store.watch(storeWatch)

  const { set, get, adapter } = createAdapter()
  persist({
    adapter,
    source: sample($store, debounced, (value) => value),
    target: $store,
  })

  // after `persist`
  assert.strictEqual(set.mock.callCount(), 0)
  assert.strictEqual(get.mock.callCount(), 1) // <- get undefined value from storage
  assert.strictEqual(incrementWatch.mock.callCount(), 0)
  assert.strictEqual(debouncedWatch.mock.callCount(), 0)
  assert.strictEqual(storeWatch.mock.callCount(), 1) // <- first watch on store

  // let's go

  // 1
  increment()
  assert.strictEqual(set.mock.callCount(), 0) // <- did not change
  assert.strictEqual(get.mock.callCount(), 1)
  assert.strictEqual(incrementWatch.mock.callCount(), 1)
  assert.strictEqual(debouncedWatch.mock.callCount(), 0) // <- did not change
  assert.strictEqual(storeWatch.mock.callCount(), 2)

  // 2
  increment()
  assert.strictEqual(set.mock.callCount(), 0) // <- did not change
  assert.strictEqual(get.mock.callCount(), 1)
  assert.strictEqual(incrementWatch.mock.callCount(), 2)
  assert.strictEqual(debouncedWatch.mock.callCount(), 0) // <- did not change
  assert.strictEqual(storeWatch.mock.callCount(), 3)

  // 3
  increment()
  assert.strictEqual(set.mock.callCount(), 0) // <- did not change
  assert.strictEqual(get.mock.callCount(), 1)
  assert.strictEqual(incrementWatch.mock.callCount(), 3)
  assert.strictEqual(debouncedWatch.mock.callCount(), 0) // <- did not change
  assert.strictEqual(storeWatch.mock.callCount(), 4)

  // 4
  increment()
  assert.strictEqual(set.mock.callCount(), 0) // <- did not change
  assert.strictEqual(get.mock.callCount(), 1)
  assert.strictEqual(incrementWatch.mock.callCount(), 4)
  assert.strictEqual(debouncedWatch.mock.callCount(), 0) // <- did not change
  assert.strictEqual(storeWatch.mock.callCount(), 5)

  // wait for debounced
  await new Promise((resolve) => setTimeout(resolve, 15))

  assert.strictEqual(set.mock.callCount(), 1) // <- called
  assert.strictEqual(get.mock.callCount(), 1)
  assert.strictEqual(incrementWatch.mock.callCount(), 4)
  assert.strictEqual(debouncedWatch.mock.callCount(), 1) // <- called
  assert.strictEqual(storeWatch.mock.callCount(), 5)

  // check all arguments
  assert.strictEqual(set.mock.calls.length, 1)
  assert.strictEqual(set.mock.calls[0].result, 4)
  assert.deepEqual(set.mock.calls[0].arguments, [4])
  assert.strictEqual(set.mock.calls[0].error, undefined)

  assert.strictEqual(get.mock.calls.length, 1)
  assert.strictEqual(get.mock.calls[0].result, undefined)
  assert.deepEqual(get.mock.calls[0].arguments, [undefined, undefined])
  assert.strictEqual(get.mock.calls[0].error, undefined)

  assert.strictEqual(incrementWatch.mock.calls.length, 4)
  assert.strictEqual(incrementWatch.mock.calls[0].result, undefined)
  assert.deepEqual(incrementWatch.mock.calls[0].arguments, [undefined])
  assert.strictEqual(incrementWatch.mock.calls[0].error, undefined)
  assert.strictEqual(incrementWatch.mock.calls[1].result, undefined)
  assert.deepEqual(incrementWatch.mock.calls[1].arguments, [undefined])
  assert.strictEqual(incrementWatch.mock.calls[1].error, undefined)
  assert.strictEqual(incrementWatch.mock.calls[2].result, undefined)
  assert.deepEqual(incrementWatch.mock.calls[2].arguments, [undefined])
  assert.strictEqual(incrementWatch.mock.calls[2].error, undefined)
  assert.strictEqual(incrementWatch.mock.calls[3].result, undefined)
  assert.deepEqual(incrementWatch.mock.calls[3].arguments, [undefined])
  assert.strictEqual(incrementWatch.mock.calls[3].error, undefined)

  assert.strictEqual(debouncedWatch.mock.calls.length, 1)
  assert.strictEqual(debouncedWatch.mock.calls[0].result, undefined)
  assert.deepEqual(debouncedWatch.mock.calls[0].arguments, [undefined])
  assert.strictEqual(debouncedWatch.mock.calls[0].error, undefined)

  assert.strictEqual(storeWatch.mock.calls.length, 5)
  assert.strictEqual(storeWatch.mock.calls[0].result, undefined)
  assert.deepEqual(storeWatch.mock.calls[0].arguments, [0])
  assert.strictEqual(storeWatch.mock.calls[0].error, undefined)
  assert.strictEqual(storeWatch.mock.calls[1].result, undefined)
  assert.deepEqual(storeWatch.mock.calls[1].arguments, [1])
  assert.strictEqual(storeWatch.mock.calls[1].error, undefined)
  assert.strictEqual(storeWatch.mock.calls[2].result, undefined)
  assert.deepEqual(storeWatch.mock.calls[2].arguments, [2])
  assert.strictEqual(storeWatch.mock.calls[2].error, undefined)
  assert.strictEqual(storeWatch.mock.calls[3].result, undefined)
  assert.deepEqual(storeWatch.mock.calls[3].arguments, [3])
  assert.strictEqual(storeWatch.mock.calls[3].error, undefined)
  assert.strictEqual(storeWatch.mock.calls[4].result, undefined)
  assert.deepEqual(storeWatch.mock.calls[4].arguments, [4])
  assert.strictEqual(storeWatch.mock.calls[4].error, undefined)
})

test('storage updates should be debounced, using clock', async () => {
  const incrementWatch = mock.fn()
  const storeWatch = mock.fn()

  const increment = createEvent()
  increment.watch(incrementWatch)

  const $store = createStore(0, { name: 'debounced' }).on(
    increment,
    (state) => state + 1
  )
  $store.watch(storeWatch)

  const { set, get, adapter } = createAdapter()
  persist({
    adapter,
    store: $store,
    clock: debounce({ source: $store, timeout: 10 }),
  })

  // after `persist`
  assert.strictEqual(set.mock.callCount(), 0)
  assert.strictEqual(get.mock.callCount(), 1) // <- get undefined value from storage
  assert.strictEqual(incrementWatch.mock.callCount(), 0)
  assert.strictEqual(storeWatch.mock.callCount(), 1) // <- first watch on store

  // let's go

  // 1
  increment()
  assert.strictEqual(set.mock.callCount(), 0) // <- did not change
  assert.strictEqual(get.mock.callCount(), 1)
  assert.strictEqual(incrementWatch.mock.callCount(), 1)
  assert.strictEqual(storeWatch.mock.callCount(), 2)

  // 2
  increment()
  assert.strictEqual(set.mock.callCount(), 0) // <- did not change
  assert.strictEqual(get.mock.callCount(), 1)
  assert.strictEqual(incrementWatch.mock.callCount(), 2)
  assert.strictEqual(storeWatch.mock.callCount(), 3)

  // 3
  increment()
  assert.strictEqual(set.mock.callCount(), 0) // <- did not change
  assert.strictEqual(get.mock.callCount(), 1)
  assert.strictEqual(incrementWatch.mock.callCount(), 3)
  assert.strictEqual(storeWatch.mock.callCount(), 4)

  // 4
  increment()
  assert.strictEqual(set.mock.callCount(), 0) // <- did not change
  assert.strictEqual(get.mock.callCount(), 1)
  assert.strictEqual(incrementWatch.mock.callCount(), 4)
  assert.strictEqual(storeWatch.mock.callCount(), 5)

  // wait for debounced
  await new Promise((resolve) => setTimeout(resolve, 15))

  assert.strictEqual(set.mock.callCount(), 1) // <- called
  assert.strictEqual(get.mock.callCount(), 1)
  assert.strictEqual(incrementWatch.mock.callCount(), 4)
  assert.strictEqual(storeWatch.mock.callCount(), 5)

  // check all arguments
  assert.strictEqual(set.mock.calls.length, 1)
  assert.strictEqual(set.mock.calls[0].result, 4)
  assert.deepEqual(set.mock.calls[0].arguments, [4])
  assert.strictEqual(set.mock.calls[0].error, undefined)

  assert.strictEqual(get.mock.calls.length, 1)
  assert.strictEqual(get.mock.calls[0].result, undefined)
  assert.deepEqual(get.mock.calls[0].arguments, [undefined, undefined])
  assert.strictEqual(get.mock.calls[0].error, undefined)

  assert.strictEqual(incrementWatch.mock.calls.length, 4)
  assert.strictEqual(incrementWatch.mock.calls[0].result, undefined)
  assert.deepEqual(incrementWatch.mock.calls[0].arguments, [undefined])
  assert.strictEqual(incrementWatch.mock.calls[0].error, undefined)
  assert.strictEqual(incrementWatch.mock.calls[1].result, undefined)
  assert.deepEqual(incrementWatch.mock.calls[1].arguments, [undefined])
  assert.strictEqual(incrementWatch.mock.calls[1].error, undefined)
  assert.strictEqual(incrementWatch.mock.calls[2].result, undefined)
  assert.deepEqual(incrementWatch.mock.calls[2].arguments, [undefined])
  assert.strictEqual(incrementWatch.mock.calls[2].error, undefined)
  assert.strictEqual(incrementWatch.mock.calls[3].result, undefined)
  assert.deepEqual(incrementWatch.mock.calls[3].arguments, [undefined])
  assert.strictEqual(incrementWatch.mock.calls[3].error, undefined)

  assert.strictEqual(storeWatch.mock.calls.length, 5)
  assert.strictEqual(storeWatch.mock.calls[0].result, undefined)
  assert.deepEqual(storeWatch.mock.calls[0].arguments, [0])
  assert.strictEqual(storeWatch.mock.calls[0].error, undefined)
  assert.strictEqual(storeWatch.mock.calls[1].result, undefined)
  assert.deepEqual(storeWatch.mock.calls[1].arguments, [1])
  assert.strictEqual(storeWatch.mock.calls[1].error, undefined)
  assert.strictEqual(storeWatch.mock.calls[2].result, undefined)
  assert.deepEqual(storeWatch.mock.calls[2].arguments, [2])
  assert.strictEqual(storeWatch.mock.calls[2].error, undefined)
  assert.strictEqual(storeWatch.mock.calls[3].result, undefined)
  assert.deepEqual(storeWatch.mock.calls[3].arguments, [3])
  assert.strictEqual(storeWatch.mock.calls[3].error, undefined)
  assert.strictEqual(storeWatch.mock.calls[4].result, undefined)
  assert.deepEqual(storeWatch.mock.calls[4].arguments, [4])
  assert.strictEqual(storeWatch.mock.calls[4].error, undefined)
})
