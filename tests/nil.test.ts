import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { createStore } from 'effector'
import { persist } from '../src'
import { nil } from '../src/nil'

//
// Tests
//

test('store should ignore initial `undefined` from storage value', () => {
  const $counter0 = createStore(42, { name: 'nil::counter0' })
  persist({ store: $counter0, with: nil })
  assert.is($counter0.getState(), 42)
})

test('store new value should be ignored by storage', () => {
  const $counter1 = createStore(0, { name: 'nil::counter1' })
  persist({ store: $counter1, with: nil })
  ;($counter1 as any).setState(42)
  assert.is($counter1.getState(), 42)
})

//
// Launch tests
//

test.run()
