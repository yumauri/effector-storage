import { createEvent, createStore } from 'effector'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { persist } from '../src/local'

/**
 * Test for https://github.com/yumauri/effector-storage/issues/146
 *
 * In some cases localStorage could be null, for example
 * - https://community.brave.com/t/localstorage-and-sessionstorage-are-null/207741
 * - https://bugs.openjdk.org/browse/JDK-8255940
 * - https://github.com/launchdarkly/react-client-sdk/issues/109
 * Latest issue has comment, that this "could mean that the storage was full, or that
 * it was disabled because the browser was in private mode; browser behavior in these
 * cases is not really standardized, they can throw whatever error they feel like".
 *
 * This should not break effector-storage.
 */

//
// Mock `localStorage` as null
//

declare let global: any

beforeAll(() => {
  global.localStorage = null
})

afterAll(() => {
  global.localStorage = undefined
})

//
// Tests
//

it('should still work in case localStorage is null', async () => {
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
  expect(error).toBeInstanceOf(TypeError)
  expect(error.message).toMatch(/Cannot read properties of null/)
})
