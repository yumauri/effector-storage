import type { StorageAdapter } from '../src/types'
import { it, vi, expect } from 'vitest'
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

it('should call watcher twice', () => {
  const watch = vi.fn()

  const $store = createStore(1)
  $store.watch(watch)

  persist({ store: $store, adapter: dumbAdapter, key: 'domain::store0' })

  expect($store.getState()).toBe(0)
  expect($store.defaultState).toBe(1)

  // call watcher twice
  expect(watch).toHaveBeenCalledTimes(2)
  expect(watch.mock.calls[0]).toEqual([1])
  expect(watch.mock.calls[1]).toEqual([0])
})

it('should call watcher once if persisted in domain hook', () => {
  const watch = vi.fn()
  const root = createDomain()

  root.onCreateStore((store) => {
    persist({ store, adapter: dumbAdapter })
  })

  const $store = root.createStore(1, { name: 'domain::store1' })
  $store.watch(watch)

  expect($store.getState()).toBe(0)
  expect($store.defaultState).toBe(1)

  // call watcher once
  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0]).toEqual([0])
})

it('should throw error in case of missing name in named domain', async () => {
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
    expect.unreachable()
  } catch (err) {
    expect(err).toBeInstanceOf(Error)
    expect((err as Error).message).toMatch(/Key or name is not defined/)
  }
})
