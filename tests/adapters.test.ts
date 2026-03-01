import { it, beforeEach, afterEach, expect } from 'vitest'
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

beforeEach(() => {
  global.localStorage = createStorageMock()
  global.sessionStorage = createStorageMock()
  events = createEventsMock()
  global.addEventListener = events.addEventListener
  global.history = createHistoryMock(null, '', 'http://domain.test')
  global.location = createLocationMock('http://domain.test')
  global.history._location(global.location)
  global.location._history(global.history)
})

afterEach(() => {
  global.localStorage = undefined
  global.sessionStorage = undefined
  global.addEventListener = undefined
  global.history = undefined
  global.location = undefined
})

//
// Tests
//

it('should be possible to use different adapters', async () => {
  const $counter = createStore(0, { name: 'counter' })
  persist({ adapter: local(), store: $counter })
  persist({ adapter: session(), store: $counter })
  persist({ adapter: query({ def: 0 }), store: $counter })
  expect($counter.getState()).toBe(0)

  global.localStorage.setItem('counter', '1')
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: 'counter',
    oldValue: null,
    newValue: '1',
  })

  expect($counter.getState()).toBe(1)

  // should update `sessionStorage`
  // because store got updated from `localStorage`
  expect(global.sessionStorage.getItem('counter')).toBe('1')

  // should update query string as well
  expect(global.location.search).toBe('?counter=1')
})
