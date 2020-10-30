import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { createStore } from 'effector'
import { createStorageMock } from './mocks/storage.mock'

//
// Mock Storage adapter and events
//

declare let global: any
global.window = global.window || {}

const sessionStorageMock = global.window.sessionStorage || createStorageMock()
global.sessionStorage = global.window.sessionStorage = sessionStorageMock

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
  const store$ = createStore(0, { name: 'session::store' })
  assert.not.throws(() => persist({ store: store$ }))
})

//
// Launch tests
//

test.run()
