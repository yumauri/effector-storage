import type { Events } from './mocks/events.mock'
import { createStore } from 'effector'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { createPersist } from '../src/local'
import { createEventsMock } from './mocks/events.mock'
import { createStorageMock } from './mocks/storage.mock'

//
// Mock `localStorage` and events
//

declare let global: any
let events: Events

beforeAll(() => {
  global.localStorage = createStorageMock()
  events = createEventsMock()
  global.addEventListener = events.addEventListener
})

afterAll(() => {
  global.localStorage = undefined
  global.addEventListener = undefined
})

//
// Tests
//

it('key should be prefixed with keyPrefix', async () => {
  const persist = createPersist({
    keyPrefix: 'app/',
  })

  const $counter = createStore(0, { name: 'counter' })
  persist({ store: $counter })
  expect($counter.getState()).toBe(0)

  //
  ;($counter as any).setState(1)
  expect(global.localStorage.getItem('counter')).toBe(null)
  expect(global.localStorage.getItem('app/counter')).toBe('1')

  global.localStorage.setItem('app/counter', '2')
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: 'app/counter',
    oldValue: null,
    newValue: '2',
  })

  expect($counter.getState()).toBe(2)
})
