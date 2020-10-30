import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { createStore } from 'effector'
import { createStorageMock } from './mocks/storage.mock'

//
// Mock Storage adapter and events
//

declare let global: any

test.before(() => {
  // I'm pretty sure this is the bad hack
  // but I need module to be imported and executed anew
  delete require.cache[require.resolve('../src/session')]

  global.sessionStorage = createStorageMock()
})

test.after(() => {
  delete global.sessionStorage
})

//
// Tests
//

test('should export adapter and `persist` function', async () => {
  const { sessionStorage, persist } = await import('../src/session')
  assert.type(sessionStorage, 'function')
  assert.type(persist, 'function')
})

test('should be ok on good parameters', async () => {
  const { persist } = await import('../src/session')
  const $store = createStore(0, { name: 'session::store' })
  assert.not.throws(() => persist({ store: $store }))
})

//
// Launch tests
//

test.run()
