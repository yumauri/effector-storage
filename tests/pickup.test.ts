import { createEvent, createStore } from 'effector'
import { expect, it, vi } from 'vitest'
import { persist } from '../src/core'
import { storage } from '../src/storage'
import { createStorageMock } from './mocks/storage.mock'

//
// Tests
//

it('should NOT pickup new initial value', () => {
  const watch = vi.fn()

  const mockStorage = createStorageMock()
  mockStorage.setItem('$store', '0')

  const adapter = storage({ storage: () => mockStorage })

  const pickup = createEvent()
  const $store = createStore(1, { name: '$store' })
  $store.watch(watch)

  expect($store.getState()).toBe(1)
  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0]).toEqual([1])

  persist({ store: $store, adapter, pickup })

  expect($store.getState()).toBe(1) // <- original store value
  expect(watch).toHaveBeenCalledTimes(1)
})

it('should pickup new value on event', () => {
  const watch = vi.fn()

  const mockStorage = createStorageMock()
  mockStorage.setItem('$store', '42')

  const adapter = storage({ storage: () => mockStorage })

  const pickup = createEvent()
  const unusedPickup = createEvent()
  const $store = createStore(1, { name: '$store' })
  $store.watch(watch)

  expect($store.getState()).toBe(1)
  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0]).toEqual([1])

  persist({ store: $store, adapter, pickup: [pickup, unusedPickup] })
  pickup() // <- pick up new value

  expect($store.getState()).toBe(42)
  expect(watch).toHaveBeenCalledTimes(2)
  expect(watch.mock.calls[1]).toEqual([42])
})
