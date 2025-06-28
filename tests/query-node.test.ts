import { test, beforeEach, afterEach } from 'node:test'
import * as assert from 'node:assert/strict'
import { createStore } from 'effector'
import { createHistoryMock } from './mocks/history.mock'
import { createLocationMock } from './mocks/location.mock'
import { persist } from '../src/query'

//
// Mock history, location and events
//

declare let global: any

beforeEach(() => {
  global.history = createHistoryMock(null, '', 'http://domain.test')
  global.location = createLocationMock('http://domain.test')
  global.history._location(global.location)
  global.location._history(global.history)
})

afterEach(() => {
  global.history = undefined
  global.location = undefined
})

//
// Tests
//

test('should not fail if there is no `addEventListener`', () => {
  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  assert.strictEqual(global.location.search, '')
  ;($id as any).setState('9876')
  assert.strictEqual(global.location.search, '?id=9876')
})

test('should not fail if there is no `location`', () => {
  global.location = undefined
  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  ;($id as any).setState('9876')
})

test('should not fail if there is no `history`', () => {
  global.history = undefined
  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  ;($id as any).setState('9876')
})

test('should not fail if there is no `history` and `location`', () => {
  global.history = undefined
  global.location = undefined
  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  ;($id as any).setState('9876')
})
