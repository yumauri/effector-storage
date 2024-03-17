import { test } from 'uvu'
import { snoop } from 'snoop'
import * as assert from 'uvu/assert'
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

test.before(() => {
  global.localStorage = null
})

test.after(() => {
  delete global.localStorage
})

//
// Tests
//

test('should still work in case localStorage is null', async () => {
  const watch = snoop(() => undefined)

  const fail = createEvent<any>()
  fail.watch(watch.fn)

  const $counter = createStore(0, { name: 'counter' })
  assert.not.throws(() => persist({ store: $counter, fail }))

  assert.is(watch.callCount, 1)
  const { error, ...args } = watch.calls[0].arguments[0 as any] as any
  assert.equal(args, {
    key: 'counter',
    keyPrefix: '',
    operation: 'get',
    value: undefined,
  })
  assert.instance(error, TypeError)
  assert.match(error, /Cannot read properties of null/)
})

//
// Launch tests
//

test.run()
