import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { createStore } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { persist } from '../src/core'
import { nil } from '../src/nil'
import { persist as local } from '../src/local'
import { persist as session } from '../src/session'

declare let global: any

//
// Tests
//

test('store should ignore initial `undefined` from storage value', () => {
  const $counter0 = createStore(42, { name: 'nil::counter0' })
  persist({ store: $counter0, adapter: nil() })
  assert.is($counter0.getState(), 42)
})

test('store new value should be ignored by storage', () => {
  const $counter1 = createStore(0, { name: 'nil::counter1' })
  persist({ store: $counter1, adapter: nil() })
  ;($counter1 as any).setState(42)
  assert.is($counter1.getState(), 42)
})

test('stores in browser environment should not be synced', () => {
  // add fake `localStorage` and `sessionStorage`
  // like this is browser environment
  global.localStorage = createStorageMock()
  global.sessionStorage = createStorageMock()

  try {
    const $store1 = createStore(0)
    const $store2 = createStore(0)

    local({ store: $store1, key: 'store' })
    session({ store: $store2, key: 'store' })

    // update one of two stores
    ;($store1 as any).setState(42)

    assert.is($store1.getState(), 42)
    assert.is($store2.getState(), 0) // <- should not change
  } finally {
    // remove fake `localStorage` and `sessionStorage`
    delete global.localStorage
    delete global.sessionStorage
  }
})

// issue #26
test('stores in node environment should not be synced', () => {
  const $store1 = createStore(0)
  const $store2 = createStore(0)

  local({ store: $store1, key: 'store' })
  session({ store: $store2, key: 'store' })

  // update one of two stores
  ;($store1 as any).setState(42)

  assert.is($store1.getState(), 42)
  assert.is($store2.getState(), 0) // <- should not change
})

//
// Launch tests
//

test.run()
