import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { createStore } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { session, persist } from '../src/session'

//
// Mock `sessionStorage`
//

declare let global: any

test.before(() => {
  global.sessionStorage = createStorageMock()
})

test.after(() => {
  delete global.sessionStorage
})

//
// Tests
//

test('should export adapter and `persist` function', () => {
  assert.type(session, 'function')
  assert.type(persist, 'function')
})

test('should be ok on good parameters', () => {
  const $store = createStore(0, { name: 'session::store' })
  assert.not.throws(() => persist({ store: $store }))
})

//
// Launch tests
//

test.run()
