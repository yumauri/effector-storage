import { test, before, after, mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { createEvent, createStore } from 'effector'
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

before(() => {
  global.localStorage = null
})

after(() => {
  global.localStorage = undefined
})

//
// Tests
//

test('should still work in case localStorage is null', async () => {
  const watch = mock.fn()

  const fail = createEvent<any>()
  fail.watch(watch)

  const $counter = createStore(0, { name: 'counter' })
  assert.doesNotThrow(() => persist({ store: $counter, fail }))

  assert.strictEqual(watch.mock.callCount(), 1)
  const { error, ...args } = watch.mock.calls[0].arguments[0 as any] as any
  assert.deepEqual(args, {
    key: 'counter',
    keyPrefix: '',
    operation: 'get',
    value: undefined,
  })
  assert.ok(error instanceof TypeError)
  assert.match(error.message, /Cannot read properties of null/)
})
