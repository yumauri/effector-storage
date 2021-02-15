import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { createStore } from 'effector'
import { createHistoryMock } from './mocks/history.mock'
import { createLocationMock } from './mocks/location.mock'
import { persist } from '../src/query'

//
// Mock history, location and events
//

declare let global: any

test.before.each(() => {
  global.history = createHistoryMock(null, '', 'http://domain.test')
  global.location = createLocationMock('http://domain.test')
  global.history._location(global.location)
  global.location._history(global.history)
})

test.after.each(() => {
  delete global.history
  delete global.location
})

//
// Tests
//

test('should not fail if there is no `addEventListener`', () => {
  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  assert.is(global.location.search, '')
  ;($id as any).setState('9876')
  assert.is(global.location.search, '?id=9876')
})

test('should not fail if there is no `location`', () => {
  delete global.location
  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  ;($id as any).setState('9876')
})

test('should not fail if there is no `history`', () => {
  delete global.history
  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  ;($id as any).setState('9876')
})

test('should not fail if there is no `history` and `location`', () => {
  delete global.history
  delete global.location
  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  ;($id as any).setState('9876')
})

//
// Launch tests
//

test.run()
