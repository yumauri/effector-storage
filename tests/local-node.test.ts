import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { createStore } from 'effector'
import { persist } from '../src/local'

//
// Mock `localStorage`
//

declare let global: any

let storage: Storage

test.before(() => {
  storage = global.localStorage
  global.localStorage = undefined
})

test.after(() => {
  global.localStorage = storage
})

//
// Tests
//

test('store should ignore initial value if localStorage is not exists', () => {
  const $counter0 = createStore(42, { name: 'local-node::counter0' })
  persist({ store: $counter0 })
  assert.is($counter0.getState(), 42)
})

test('store new value should be ignored by storage', () => {
  const $counter1 = createStore(0, { name: 'local-node::counter1' })
  persist({ store: $counter1 })
  ;($counter1 as any).setState(42)
  assert.is($counter1.getState(), 42)
})

//
// Launch tests
//

test.run()
