import { it, beforeAll, afterAll, expect } from 'vitest'
import { createStore } from 'effector'
import { persist } from '../src/local'

//
// Mock `localStorage`
//

declare let global: any

let storage: Storage

beforeAll(() => {
  storage = global.localStorage
  global.localStorage = undefined
})

afterAll(() => {
  global.localStorage = storage
})

//
// Tests
//

it('store should ignore initial value if localStorage is not exists', () => {
  const $counter0 = createStore(42, { name: 'local-node::counter0' })
  persist({ store: $counter0 })
  expect($counter0.getState()).toBe(42)
})

it('store new value should be ignored by storage', () => {
  const $counter1 = createStore(0, { name: 'local-node::counter1' })
  persist({ store: $counter1 })
  ;($counter1 as any).setState(42)
  expect($counter1.getState()).toBe(42)
})
