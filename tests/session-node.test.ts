import { test, before, after } from 'node:test'
import * as assert from 'node:assert/strict'
import { createStore } from 'effector'
import { persist } from '../src/session'

//
// Mock `sessionStorage`
//

declare let global: any

let storage: Storage

before(() => {
  storage = global.sessionStorage
  global.sessionStorage = undefined
})

after(() => {
  global.sessionStorage = storage
})

//
// Tests
//

test('store should ignore initial value if sessionStorage is not exists', () => {
  const $counter0 = createStore(42, { name: 'session-node::counter0' })
  persist({ store: $counter0 })
  assert.strictEqual($counter0.getState(), 42)
})

test('store new value should be ignored by storage', () => {
  const $counter1 = createStore(0, { name: 'session-node::counter1' })
  persist({ store: $counter1 })
  ;($counter1 as any).setState(42)
  assert.strictEqual($counter1.getState(), 42)
})
