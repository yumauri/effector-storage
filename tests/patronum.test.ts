import type { StorageAdapter } from '../src/types'
import { it, vi, expect } from 'vitest'
import { createEvent, createStore, sample } from 'effector'
import { debounce } from 'patronum/debounce'
import { persist } from '../src/core'

//
// Fake adapter
//

const createAdapter = (): {
  set: ReturnType<typeof vi.fn>
  get: ReturnType<typeof vi.fn>
  adapter: StorageAdapter
} => {
  const set = vi.fn((value: any) => value)
  const get = vi.fn((_raw: any, value: any) => value)

  const adapter: StorageAdapter = <T>() => {
    let __: T = undefined as any
    return {
      get: (raw: any): T => get(raw, __),
      set: (value: T) => (__ = set(value)),
    }
  }

  return { set, get, adapter }
}

const resultOf = (fn: ReturnType<typeof vi.fn>, index: number) => {
  const call = fn.mock.results[index]
  return call?.type === 'return' ? call.value : undefined
}

const errorOf = (fn: ReturnType<typeof vi.fn>, index: number) => {
  const call = fn.mock.results[index]
  return call?.type === 'throw' ? call.value : undefined
}

//
// Tests
//

it('storage updates should be debounced', async () => {
  const incrementWatch = vi.fn()
  const debouncedWatch = vi.fn()
  const storeWatch = vi.fn()

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
  expect(set).toHaveBeenCalledTimes(0)
  expect(get).toHaveBeenCalledTimes(1) // <- get undefined value from storage
  expect(incrementWatch).toHaveBeenCalledTimes(0)
  expect(debouncedWatch).toHaveBeenCalledTimes(0)
  expect(storeWatch).toHaveBeenCalledTimes(1) // <- first watch on store

  // let's go

  // 1
  increment()
  expect(set).toHaveBeenCalledTimes(0) // <- did not change
  expect(get).toHaveBeenCalledTimes(1)
  expect(incrementWatch).toHaveBeenCalledTimes(1)
  expect(debouncedWatch).toHaveBeenCalledTimes(0) // <- did not change
  expect(storeWatch).toHaveBeenCalledTimes(2)

  // 2
  increment()
  expect(set).toHaveBeenCalledTimes(0) // <- did not change
  expect(get).toHaveBeenCalledTimes(1)
  expect(incrementWatch).toHaveBeenCalledTimes(2)
  expect(debouncedWatch).toHaveBeenCalledTimes(0) // <- did not change
  expect(storeWatch).toHaveBeenCalledTimes(3)

  // 3
  increment()
  expect(set).toHaveBeenCalledTimes(0) // <- did not change
  expect(get).toHaveBeenCalledTimes(1)
  expect(incrementWatch).toHaveBeenCalledTimes(3)
  expect(debouncedWatch).toHaveBeenCalledTimes(0) // <- did not change
  expect(storeWatch).toHaveBeenCalledTimes(4)

  // 4
  increment()
  expect(set).toHaveBeenCalledTimes(0) // <- did not change
  expect(get).toHaveBeenCalledTimes(1)
  expect(incrementWatch).toHaveBeenCalledTimes(4)
  expect(debouncedWatch).toHaveBeenCalledTimes(0) // <- did not change
  expect(storeWatch).toHaveBeenCalledTimes(5)

  // wait for debounced
  await new Promise((resolve) => setTimeout(resolve, 15))

  expect(set).toHaveBeenCalledTimes(1) // <- called
  expect(get).toHaveBeenCalledTimes(1)
  expect(incrementWatch).toHaveBeenCalledTimes(4)
  expect(debouncedWatch).toHaveBeenCalledTimes(1) // <- called
  expect(storeWatch).toHaveBeenCalledTimes(5)

  // check all arguments
  expect(set).toHaveBeenCalledTimes(1)
  expect(resultOf(set, 0)).toBe(4)
  expect(set.mock.calls[0]).toEqual([4])
  expect(errorOf(set, 0)).toBe(undefined)

  expect(get).toHaveBeenCalledTimes(1)
  expect(resultOf(get, 0)).toBe(undefined)
  expect(get.mock.calls[0]).toEqual([undefined, undefined])
  expect(errorOf(get, 0)).toBe(undefined)

  expect(incrementWatch).toHaveBeenCalledTimes(4)
  expect(resultOf(incrementWatch, 0)).toBe(undefined)
  expect(incrementWatch.mock.calls[0]).toEqual([undefined])
  expect(errorOf(incrementWatch, 0)).toBe(undefined)
  expect(resultOf(incrementWatch, 1)).toBe(undefined)
  expect(incrementWatch.mock.calls[1]).toEqual([undefined])
  expect(errorOf(incrementWatch, 1)).toBe(undefined)
  expect(resultOf(incrementWatch, 2)).toBe(undefined)
  expect(incrementWatch.mock.calls[2]).toEqual([undefined])
  expect(errorOf(incrementWatch, 2)).toBe(undefined)
  expect(resultOf(incrementWatch, 3)).toBe(undefined)
  expect(incrementWatch.mock.calls[3]).toEqual([undefined])
  expect(errorOf(incrementWatch, 3)).toBe(undefined)

  expect(debouncedWatch).toHaveBeenCalledTimes(1)
  expect(resultOf(debouncedWatch, 0)).toBe(undefined)
  expect(debouncedWatch.mock.calls[0]).toEqual([undefined])
  expect(errorOf(debouncedWatch, 0)).toBe(undefined)

  expect(storeWatch).toHaveBeenCalledTimes(5)
  expect(resultOf(storeWatch, 0)).toBe(undefined)
  expect(storeWatch.mock.calls[0]).toEqual([0])
  expect(errorOf(storeWatch, 0)).toBe(undefined)
  expect(resultOf(storeWatch, 1)).toBe(undefined)
  expect(storeWatch.mock.calls[1]).toEqual([1])
  expect(errorOf(storeWatch, 1)).toBe(undefined)
  expect(resultOf(storeWatch, 2)).toBe(undefined)
  expect(storeWatch.mock.calls[2]).toEqual([2])
  expect(errorOf(storeWatch, 2)).toBe(undefined)
  expect(resultOf(storeWatch, 3)).toBe(undefined)
  expect(storeWatch.mock.calls[3]).toEqual([3])
  expect(errorOf(storeWatch, 3)).toBe(undefined)
  expect(resultOf(storeWatch, 4)).toBe(undefined)
  expect(storeWatch.mock.calls[4]).toEqual([4])
  expect(errorOf(storeWatch, 4)).toBe(undefined)
})

it('storage updates should be debounced, using clock', async () => {
  const incrementWatch = vi.fn()
  const storeWatch = vi.fn()

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
  expect(set).toHaveBeenCalledTimes(0)
  expect(get).toHaveBeenCalledTimes(1) // <- get undefined value from storage
  expect(incrementWatch).toHaveBeenCalledTimes(0)
  expect(storeWatch).toHaveBeenCalledTimes(1) // <- first watch on store

  // let's go

  // 1
  increment()
  expect(set).toHaveBeenCalledTimes(0) // <- did not change
  expect(get).toHaveBeenCalledTimes(1)
  expect(incrementWatch).toHaveBeenCalledTimes(1)
  expect(storeWatch).toHaveBeenCalledTimes(2)

  // 2
  increment()
  expect(set).toHaveBeenCalledTimes(0) // <- did not change
  expect(get).toHaveBeenCalledTimes(1)
  expect(incrementWatch).toHaveBeenCalledTimes(2)
  expect(storeWatch).toHaveBeenCalledTimes(3)

  // 3
  increment()
  expect(set).toHaveBeenCalledTimes(0) // <- did not change
  expect(get).toHaveBeenCalledTimes(1)
  expect(incrementWatch).toHaveBeenCalledTimes(3)
  expect(storeWatch).toHaveBeenCalledTimes(4)

  // 4
  increment()
  expect(set).toHaveBeenCalledTimes(0) // <- did not change
  expect(get).toHaveBeenCalledTimes(1)
  expect(incrementWatch).toHaveBeenCalledTimes(4)
  expect(storeWatch).toHaveBeenCalledTimes(5)

  // wait for debounced
  await new Promise((resolve) => setTimeout(resolve, 15))

  expect(set).toHaveBeenCalledTimes(1) // <- called
  expect(get).toHaveBeenCalledTimes(1)
  expect(incrementWatch).toHaveBeenCalledTimes(4)
  expect(storeWatch).toHaveBeenCalledTimes(5)

  // check all arguments
  expect(set).toHaveBeenCalledTimes(1)
  expect(resultOf(set, 0)).toBe(4)
  expect(set.mock.calls[0]).toEqual([4])
  expect(errorOf(set, 0)).toBe(undefined)

  expect(get).toHaveBeenCalledTimes(1)
  expect(resultOf(get, 0)).toBe(undefined)
  expect(get.mock.calls[0]).toEqual([undefined, undefined])
  expect(errorOf(get, 0)).toBe(undefined)

  expect(incrementWatch).toHaveBeenCalledTimes(4)
  expect(resultOf(incrementWatch, 0)).toBe(undefined)
  expect(incrementWatch.mock.calls[0]).toEqual([undefined])
  expect(errorOf(incrementWatch, 0)).toBe(undefined)
  expect(resultOf(incrementWatch, 1)).toBe(undefined)
  expect(incrementWatch.mock.calls[1]).toEqual([undefined])
  expect(errorOf(incrementWatch, 1)).toBe(undefined)
  expect(resultOf(incrementWatch, 2)).toBe(undefined)
  expect(incrementWatch.mock.calls[2]).toEqual([undefined])
  expect(errorOf(incrementWatch, 2)).toBe(undefined)
  expect(resultOf(incrementWatch, 3)).toBe(undefined)
  expect(incrementWatch.mock.calls[3]).toEqual([undefined])
  expect(errorOf(incrementWatch, 3)).toBe(undefined)

  expect(storeWatch).toHaveBeenCalledTimes(5)
  expect(resultOf(storeWatch, 0)).toBe(undefined)
  expect(storeWatch.mock.calls[0]).toEqual([0])
  expect(errorOf(storeWatch, 0)).toBe(undefined)
  expect(resultOf(storeWatch, 1)).toBe(undefined)
  expect(storeWatch.mock.calls[1]).toEqual([1])
  expect(errorOf(storeWatch, 1)).toBe(undefined)
  expect(resultOf(storeWatch, 2)).toBe(undefined)
  expect(storeWatch.mock.calls[2]).toEqual([2])
  expect(errorOf(storeWatch, 2)).toBe(undefined)
  expect(resultOf(storeWatch, 3)).toBe(undefined)
  expect(storeWatch.mock.calls[3]).toEqual([3])
  expect(errorOf(storeWatch, 3)).toBe(undefined)
  expect(resultOf(storeWatch, 4)).toBe(undefined)
  expect(storeWatch.mock.calls[4]).toEqual([4])
  expect(errorOf(storeWatch, 4)).toBe(undefined)
})
