import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { createStore } from 'effector'
import { persist } from '../src/session'

//
// Mock `sessionStorage`
//

declare let global: any

test.before(() => {
  Object.defineProperty(global, 'sessionStorage', {
    configurable: true,
    get() {
      throw new Error('Access denied')
    },
  })
})

test.after(() => {
  delete global.sessionStorage
})

//
// Tests
//

test('should not fail on forbidden sessionStorage', async () => {
  const $counter = createStore(0, { name: 'counter' })
  assert.not.throws(() => persist({ store: $counter }))
})

//
// Launch tests
//

test.run()
