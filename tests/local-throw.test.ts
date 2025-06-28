import { test, before, after, mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { createEvent, createStore } from 'effector'
import { persist } from '../src/local'

//
// Mock `localStorage`
//

declare let global: any

before(() => {
  Object.defineProperty(global, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('Access denied')
    },
  })
})

after(() => {
  delete global.localStorage
})

//
// Tests
//

test('should not fail on forbidden localStorage', async () => {
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
  assert.ok(error instanceof Error)
  assert.match(error.message, /Access denied/)
})
