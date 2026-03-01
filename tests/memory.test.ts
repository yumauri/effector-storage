import { createStore } from 'effector'
import { expect, it, vi } from 'vitest'
import { memory as memoryIndex } from '../src'
import { memory, persist } from '../src/memory'

//
// Tests
//

it('should export adapter and `persist` function', () => {
  expect(typeof memory === 'function').toBeTruthy()
  expect(typeof persist === 'function').toBeTruthy()
})

it('should be exported from package root', () => {
  expect(memory).toBe(memoryIndex)
})

it('should be ok on good parameters', () => {
  const $store = createStore(0, { name: 'memory::store' })
  expect(() => persist({ store: $store })).not.toThrow()
})

it('should sync stores, persisted with memory adapter', () => {
  const watch = vi.fn()

  const $store0 = createStore(1)
  const $store1 = createStore(2)
  $store0.watch(watch)
  $store1.watch(watch)

  expect($store0.getState()).toBe(1)
  expect($store1.getState()).toBe(2)
  expect(watch).toHaveBeenCalledTimes(2)
  expect(watch.mock.calls[0]).toEqual([1])
  expect(watch.mock.calls[1]).toEqual([2])

  persist({ store: $store0, key: 'same-key-1' })
  persist({ store: $store1, key: 'same-key-1' })

  expect($store0.getState()).toBe(1)
  expect($store1.getState()).toBe(2)
  expect(watch).toHaveBeenCalledTimes(2)

  //
  ;($store0 as any).setState(3)

  expect($store0.getState()).toBe(3)
  expect($store1.getState()).toBe(3) // <- also changes
  expect(watch).toHaveBeenCalledTimes(4)
  expect(watch.mock.calls[2]).toEqual([3])
  expect(watch.mock.calls[3]).toEqual([3])
})
