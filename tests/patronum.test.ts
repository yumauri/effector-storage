import { debounce } from 'patronum/debounce'
import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop, Snoop } from 'snoop'
import { createEvent, createStore, sample } from 'effector'
import { persist, StorageAdapter } from '../src'

//
// Fake adapter
//

const createAdapter = (): {
  set: Snoop<any>
  get: Snoop<any>
  adapter: StorageAdapter
} => {
  const set = snoop((value: any) => value)
  const get = snoop((_raw: any, value: any) => value)

  const adapter: StorageAdapter = <T>() => {
    let __: T = undefined as any
    return {
      get: (raw: any): T => get.fn(raw, __),
      set: (value: T) => (__ = set.fn(value)),
    }
  }

  return { set, get, adapter }
}

//
// Tests
//

test('storage updates should be debounced', async () => {
  const incrementWatch = snoop(() => undefined)
  const debouncedWatch = snoop(() => undefined)
  const storeWatch = snoop(() => undefined)

  const increment = createEvent()
  increment.watch(incrementWatch.fn)

  const debounced = debounce({ source: increment, timeout: 10 })
  debounced.watch(debouncedWatch.fn)

  const $store = createStore(0).on(increment, (state) => state + 1)
  $store.watch(storeWatch.fn)

  const { set, get, adapter } = createAdapter()
  persist({
    with: adapter,
    source: sample($store, debounced, (value) => value),
    target: $store,
  })

  // after `persist`
  assert.is(set.callCount, 0)
  assert.is(get.callCount, 1) // <- get undefined value from storage
  assert.is(incrementWatch.callCount, 0)
  assert.is(debouncedWatch.callCount, 0)
  assert.is(storeWatch.callCount, 1) // <- first watch on store

  // let's go

  // 1
  increment()
  assert.is(set.callCount, 0) // <- did not change
  assert.is(get.callCount, 1)
  assert.is(incrementWatch.callCount, 1)
  assert.is(debouncedWatch.callCount, 0) // <- did not change
  assert.is(storeWatch.callCount, 2)

  // 2
  increment()
  assert.is(set.callCount, 0) // <- did not change
  assert.is(get.callCount, 1)
  assert.is(incrementWatch.callCount, 2)
  assert.is(debouncedWatch.callCount, 0) // <- did not change
  assert.is(storeWatch.callCount, 3)

  // 3
  increment()
  assert.is(set.callCount, 0) // <- did not change
  assert.is(get.callCount, 1)
  assert.is(incrementWatch.callCount, 3)
  assert.is(debouncedWatch.callCount, 0) // <- did not change
  assert.is(storeWatch.callCount, 4)

  // 4
  increment()
  assert.is(set.callCount, 0) // <- did not change
  assert.is(get.callCount, 1)
  assert.is(incrementWatch.callCount, 4)
  assert.is(debouncedWatch.callCount, 0) // <- did not change
  assert.is(storeWatch.callCount, 5)

  // wait for debounced
  await new Promise((resolve) => setTimeout(resolve, 15))

  assert.is(set.callCount, 1) // <- called
  assert.is(get.callCount, 1)
  assert.is(incrementWatch.callCount, 4)
  assert.is(debouncedWatch.callCount, 1) // <- called
  assert.is(storeWatch.callCount, 5)

  // check all arguments
  assert.equal(set.calls, [{ result: 4, arguments: [4], error: undefined }])
  assert.equal(get.calls, [
    { result: undefined, arguments: [undefined, undefined], error: undefined },
  ])
  assert.equal(incrementWatch.calls, [
    { result: undefined, arguments: [undefined], error: undefined },
    { result: undefined, arguments: [undefined], error: undefined },
    { result: undefined, arguments: [undefined], error: undefined },
    { result: undefined, arguments: [undefined], error: undefined },
  ])
  assert.equal(debouncedWatch.calls, [
    { result: undefined, arguments: [undefined], error: undefined },
  ])
  assert.equal(storeWatch.calls, [
    { result: undefined, arguments: [0], error: undefined },
    { result: undefined, arguments: [1], error: undefined },
    { result: undefined, arguments: [2], error: undefined },
    { result: undefined, arguments: [3], error: undefined },
    { result: undefined, arguments: [4], error: undefined },
  ])
})

//
// Launch tests
//

test.run()
