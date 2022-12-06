import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { createStore } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { createEventsMock } from './mocks/events.mock'
import { local, persist } from '../src/local'

//
// Mock `localStorage` and events
//

declare let global: any
let events: ReturnType<typeof createEventsMock>

test.before(() => {
  global.localStorage = createStorageMock()
  events = createEventsMock()
  global.addEventListener = events.addEventListener
})

test.after(() => {
  delete global.localStorage
  delete global.addEventListener
})

//
// Tests
//

test('should export adapter and `persist` function', () => {
  assert.type(local, 'function')
  assert.type(persist, 'function')
})

test('should be ok on good parameters', () => {
  const $store = createStore(0, { name: 'local::store' })
  assert.not.throws(() => persist({ store: $store }))
})

test('persisted with localStorage store should be synced', async () => {
  const $counter = createStore(0, { name: 'counter' })
  persist({ store: $counter })
  assert.is($counter.getState(), 0)

  global.localStorage.setItem('counter', '1')
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: 'counter',
    oldValue: null,
    newValue: '1',
  })

  assert.is($counter.getState(), 1)
})

//
// Launch tests
//

test.run()
