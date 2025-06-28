import { test } from 'node:test'
import * as assert from 'node:assert/strict'
import { createStore } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { persist } from '../src/core'
import { nil } from '../src/nil'
import { nil as nilIndex } from '../src'
import { persist as local } from '../src/local'
import { persist as session } from '../src/session'

declare let global: any

//
// Tests
//

test('should be exported from package root', () => {
  assert.strictEqual(nil, nilIndex)
})

test('store should ignore initial `undefined` from storage value', () => {
  const $counter0 = createStore(42, { name: 'nil::counter0' })
  persist({ store: $counter0, adapter: nil })
  assert.strictEqual($counter0.getState(), 42)
})

test('store new value should be ignored by storage', () => {
  const $counter1 = createStore(0, { name: 'nil::counter1' })
  persist({ store: $counter1, adapter: nil })
  ;($counter1 as any).setState(42)
  assert.strictEqual($counter1.getState(), 42)
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

    assert.strictEqual($store1.getState(), 42)
    assert.strictEqual($store2.getState(), 0) // <- should not change
  } finally {
    // remove fake `localStorage` and `sessionStorage`
    global.localStorage = undefined
    global.sessionStorage = undefined
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

  assert.strictEqual($store1.getState(), 42)
  assert.strictEqual($store2.getState(), 0) // <- should not change
})
