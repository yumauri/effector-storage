import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { createStore } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { createEventsMock } from './mocks/events.mock'

//
// Mock Storage adapter and events
//

declare let global: any
global.window = global.window || {}

const events = global.events || createEventsMock()
global.addEventListener = global.window.addEventListener = events.addEventListener

const localStorageMock = global.window.localStorage || createStorageMock()
global.localStorage = global.window.localStorage = localStorageMock

//
// Tests
//

test('should export adapter and `persist` function', async () => {
  const { localStorage, persist, sink } = await import('../src/local')
  assert.type(localStorage, 'function')
  assert.type(persist, 'function')
  assert.type(sink, 'function')
})

test('should be ok on good parameters', async () => {
  const { persist } = await import('../src/local')
  const store$ = createStore(0, { name: 'local::store' })
  assert.not.throws(() => persist({ store: store$ }))
})

//
// Launch tests
//

test.run()
