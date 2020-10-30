import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { createStore } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { createEventsMock } from './mocks/events.mock'

//
// Mock Storage adapter and events
//

declare let global: any

test.before(() => {
  // I'm pretty sure this is the bad hack
  // but I need module to be imported and executed anew
  delete require.cache[require.resolve('../src/local')]

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

test('should export adapter and `persist` function', async () => {
  const { localStorage, persist } = await import('../src/local')
  assert.type(localStorage, 'function')
  assert.type(persist, 'function')
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
