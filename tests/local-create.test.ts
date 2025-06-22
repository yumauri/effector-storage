import { test, before, after } from 'node:test'
import * as assert from 'node:assert/strict'
import { createStore } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { type Events, createEventsMock } from './mocks/events.mock'
import { createPersist } from '../src/local'

//
// Mock `localStorage` and events
//

declare let global: any
let events: Events

before(() => {
  global.localStorage = createStorageMock()
  events = createEventsMock()
  global.addEventListener = events.addEventListener
})

after(() => {
  global.localStorage = undefined
  global.addEventListener = undefined
})

//
// Tests
//

test('key should be prefixed with keyPrefix', async () => {
  const persist = createPersist({
    keyPrefix: 'app/',
  })

  const $counter = createStore(0, { name: 'counter' })
  persist({ store: $counter })
  assert.strictEqual($counter.getState(), 0)

  //
  ;($counter as any).setState(1)
  assert.strictEqual(global.localStorage.getItem('counter'), null)
  assert.strictEqual(global.localStorage.getItem('app/counter'), '1')

  global.localStorage.setItem('app/counter', '2')
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: 'app/counter',
    oldValue: null,
    newValue: '2',
  })

  assert.strictEqual($counter.getState(), 2)
})
