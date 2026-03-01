import { it, beforeAll, afterAll, vi, expect } from 'vitest'
import { createEvent, createStore } from 'effector'
import { persist } from '../src/local'

//
// Mock `localStorage`
//

declare let global: any

beforeAll(() => {
  Object.defineProperty(global, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('Access denied')
    },
  })
})

afterAll(() => {
  delete global.localStorage
})

//
// Tests
//

it('should not fail on forbidden localStorage', async () => {
  const watch = vi.fn()

  const fail = createEvent<any>()
  fail.watch(watch)

  const $counter = createStore(0, { name: 'counter' })
  expect(() => persist({ store: $counter, fail })).not.toThrow()

  expect(watch).toHaveBeenCalledTimes(1)
  const { error, ...args } = watch.mock.calls[0][0]
  expect(args).toEqual({
    key: 'counter',
    keyPrefix: '',
    operation: 'get',
    value: undefined,
  })
  expect(error).toBeInstanceOf(Error)
  expect(error.message).toMatch(/Access denied/)
})
