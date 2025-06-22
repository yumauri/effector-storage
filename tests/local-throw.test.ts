import { test } from 'uvu'
import { snoop } from 'snoop'
import * as assert from 'uvu/assert'
import { createEvent, createStore } from 'effector'
import { persist } from '../src/local'

//
// Mock `localStorage`
//

declare let global: any

test.before(() => {
  Object.defineProperty(global, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('Access denied')
    },
  })
})

test.after(() => {
  delete global.localStorage
})

//
// Tests
//

test('should not fail on forbidden localStorage', async () => {
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
  assert.instance(error, Error)
  assert.match(error, /Access denied/)
})

//
// Launch tests
//

test.run()
