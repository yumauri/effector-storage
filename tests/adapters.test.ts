import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { createStore } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { type Events, createEventsMock } from './mocks/events.mock'
import { createHistoryMock } from './mocks/history.mock'
import { createLocationMock } from './mocks/location.mock'
import { persist } from '../src/core'
import { local } from '../src/local'
import { session } from '../src/session'
import { query } from '../src/query'

//
// Mock `localStorage` and events
//

declare let global: any
let events: Events

test.before(() => {
  global.localStorage = createStorageMock()
  global.sessionStorage = createStorageMock()
  events = createEventsMock()
  global.addEventListener = events.addEventListener
  global.history = createHistoryMock(null, '', 'http://domain.test')
  global.location = createLocationMock('http://domain.test')
  global.history._location(global.location)
  global.location._history(global.history)
})

test.after(() => {
  delete global.localStorage
  delete global.sessionStorage
  delete global.addEventListener
  delete global.history
  delete global.location
})

//
// Tests
//

test('should be possible to use different adapters', async () => {
  const $counter = createStore(0, { name: 'counter' })
  persist({ adapter: local(), store: $counter })
  persist({ adapter: session(), store: $counter })
  persist({ adapter: query({ def: 0 }), store: $counter })
  assert.is($counter.getState(), 0)

  global.localStorage.setItem('counter', '1')
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: 'counter',
    oldValue: null,
    newValue: '1',
  })

  assert.is($counter.getState(), 1)

  // should update `sessionStorage`
  // because store got updated from `localStorage`
  assert.is(global.sessionStorage.getItem('counter'), '1')

  // should update query string as well
  assert.is(global.location.search, '?counter=1')
})

//
// Launch tests
//

test.run()
