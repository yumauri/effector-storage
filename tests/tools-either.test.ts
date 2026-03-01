import type { StorageAdapter } from '../src/types'
import { it, vi, expect } from 'vitest'
import { createStore } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { persist, local, nil, log, either } from '../src'

declare let global: any

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

it('should return first adapter if first one is not noop', () => {
  const one = dumbAdapter
  const another = nil()
  expect(either(one, another)).toBe(one)
})

it('should return second adapter if first one is noop', () => {
  const one = nil()
  const another = dumbAdapter
  expect(either(one, another)).toBe(another)
})

it('should return localStorage adapter if localStorage is supported', () => {
  try {
    global.localStorage = createStorageMock()
    const one = local()
    const another = dumbAdapter
    expect(either(one, another)).toBe(one)
  } finally {
    global.localStorage = undefined
  }
})

it('should return second adapter if localStorage is not supported', () => {
  const one = local()
  const another = dumbAdapter
  expect(either(one, another)).toBe(another)
})

it('should work with factories', () => {
  const logger = vi.fn()

  const $counter1 = createStore(1, { name: 'counter1' })

  persist({
    adapter: either(local, log),
    store: $counter1,
    logger,
  })

  expect(logger).toHaveBeenCalledTimes(1)
  expect(logger.mock.calls[0]).toEqual([
    '[log adapter] get value for key "counter1"',
  ])
})
