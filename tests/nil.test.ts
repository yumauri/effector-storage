import { createStore } from 'effector'
import { expect, it } from 'vitest'
import { nil as nilIndex } from '../src'
import { persist } from '../src/core'
import { persist as local } from '../src/local'
import { nil } from '../src/nil'
import { persist as session } from '../src/session'
import { createStorageMock } from './mocks/storage.mock'

declare let global: any

//
// Tests
//

it('should be exported from package root', () => {
  expect(nil).toBe(nilIndex)
})

it('store should ignore initial `undefined` from storage value', () => {
  const $counter0 = createStore(42, { name: 'nil::counter0' })
  persist({ store: $counter0, adapter: nil })
  expect($counter0.getState()).toBe(42)
})

it('store new value should be ignored by storage', () => {
  const $counter1 = createStore(0, { name: 'nil::counter1' })
  persist({ store: $counter1, adapter: nil })
  ;($counter1 as any).setState(42)
  expect($counter1.getState()).toBe(42)
})

it('stores in browser environment should not be synced', () => {
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

    expect($store1.getState()).toBe(42)
    expect($store2.getState()).toBe(0) // <- should not change
  } finally {
    // remove fake `localStorage` and `sessionStorage`
    global.localStorage = undefined
    global.sessionStorage = undefined
  }
})

// issue #26
it('stores in node environment should not be synced', () => {
  const $store1 = createStore(0)
  const $store2 = createStore(0)

  local({ store: $store1, key: 'store' })
  session({ store: $store2, key: 'store' })

  // update one of two stores
  ;($store1 as any).setState(42)

  expect($store1.getState()).toBe(42)
  expect($store2.getState()).toBe(0) // <- should not change
})
