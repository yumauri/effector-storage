import { test, before, after } from 'node:test'
import * as assert from 'node:assert/strict'
import { createStore } from 'effector'
import { persist } from '../src/local'

//
// Mock `localStorage`
//

declare let global: any

let storage: Storage

before(() => {
  storage = global.localStorage
  global.localStorage = undefined
})

after(() => {
  global.localStorage = storage
})

//
// Tests
//

test('store should ignore initial value if localStorage is not exists', () => {
  const $counter0 = createStore(42, { name: 'local-node::counter0' })
  persist({ store: $counter0 })
  assert.strictEqual($counter0.getState(), 42)
})

test('store new value should be ignored by storage', () => {
  const $counter1 = createStore(0, { name: 'local-node::counter1' })
  persist({ store: $counter1 })
  ;($counter1 as any).setState(42)
  assert.strictEqual($counter1.getState(), 42)
})
