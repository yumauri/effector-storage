import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { createStore } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { createEventsMock } from './mocks/events.mock'
import { persist } from '../src/local'

//
// Mock Storage adapter and events
//

declare let global: any

test.before(() => {
  global.localStorage = createStorageMock()
  global.addEventListener = createEventsMock().addEventListener
})

test.after(() => {
  delete global.localStorage
  delete global.addEventListener
})

//
// Tests
//

test('should export adapter and `persist` function', () => {
  assert.type(persist, 'function')
})

test('should be ok on good parameters', () => {
  const $store = createStore(0, { name: 'local::store' })
  assert.not.throws(() => persist({ store: $store }))
})

//
// Launch tests
//

test.run()
