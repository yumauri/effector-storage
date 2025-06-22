import { test, beforeEach, afterEach, mock, type Mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { createStore } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import {
  type Events,
  createEventsMock,
  type EventsMock,
} from './mocks/events.mock'
import { persist } from '../src/local'

//
// Mock `localStorage` and events
//

declare let global: any
let events: EventsMock
let addListener: Mock<Events['addEventListener']>
let removeListener: Mock<Events['removeEventListener']>

beforeEach(() => {
  global.localStorage = createStorageMock()
  events = createEventsMock() as EventsMock

  addListener = mock.fn(events.addEventListener)
  global.addEventListener = addListener

  removeListener = mock.fn(events.removeEventListener)
  global.removeEventListener = removeListener
})

afterEach(() => {
  global.localStorage = undefined
  global.addEventListener = undefined
  global.removeEventListener = undefined
})

//
// Tests
//

test('should stop persisting on desist', async () => {
  const $counter = createStore(0, { name: 'counter' })
  const desist = persist({ store: $counter })

  // update via `storage` event
  global.localStorage.setItem('counter', '1')
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: 'counter',
    oldValue: null,
    newValue: '1',
  })
  assert.strictEqual($counter.getState(), 1)

  // update storage via store change
  ;($counter as any).setState(2)
  assert.strictEqual(global.localStorage.getItem('counter'), '2')

  // stop persisting
  desist()

  // should not update storage via store change
  ;($counter as any).setState(3)
  assert.strictEqual(global.localStorage.getItem('counter'), '2') // <- not updated

  // should not update store via `storage` event
  global.localStorage.setItem('counter', '4')
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: 'counter',
    oldValue: '2',
    newValue: '4',
  })
  assert.strictEqual($counter.getState(), 3) // <- not updated
})

test('should remove `storage` event listener on desist', async () => {
  const $counter = createStore(0, { name: 'counter' })
  const desist = persist({ store: $counter })

  assert.strictEqual(addListener.mock.callCount(), 1)
  assert.strictEqual(addListener.mock.calls[0].arguments[0], 'storage')
  const listener = addListener.mock.calls[0].arguments[1]

  assert.strictEqual(events.listeners.size, 1)
  assert.strictEqual(events.listeners.get('storage')?.length, 1)

  // stop persisting
  desist()

  assert.strictEqual(removeListener.mock.callCount(), 1)
  assert.strictEqual(removeListener.mock.calls[0].arguments[0], 'storage')
  assert.strictEqual(removeListener.mock.calls[0].arguments[1], listener)

  assert.strictEqual(events.listeners.size, 1)
  assert.strictEqual(events.listeners.get('storage')?.length, 0)
})

test('should not remove other store `storage` event listener on desist', async () => {
  const $counter1 = createStore(0, { name: 'counter' })
  const desist1 = persist({ store: $counter1 })

  assert.strictEqual(addListener.mock.callCount(), 1)
  assert.strictEqual(addListener.mock.calls[0].arguments[0], 'storage')
  const listener1 = addListener.mock.calls[0].arguments[1]

  const $counter2 = createStore(0, { name: 'counter' })
  persist({ store: $counter2 })

  assert.strictEqual(addListener.mock.callCount(), 2)
  assert.strictEqual(addListener.mock.calls[1].arguments[0], 'storage')
  const listener2 = addListener.mock.calls[1].arguments[1]

  assert.notStrictEqual(listener1, listener2)

  assert.strictEqual(events.listeners.size, 1)
  assert.strictEqual(events.listeners.get('storage')?.length, 2)
  assert.strictEqual(events.listeners.get('storage')?.[0], listener1)
  assert.strictEqual(events.listeners.get('storage')?.[1], listener2)

  // stop persisting
  desist1()

  assert.strictEqual(removeListener.mock.callCount(), 1)
  assert.strictEqual(removeListener.mock.calls[0].arguments[0], 'storage')
  assert.strictEqual(removeListener.mock.calls[0].arguments[1], listener1)

  assert.strictEqual(events.listeners.size, 1)
  assert.strictEqual(events.listeners.get('storage')?.length, 1)
  assert.strictEqual(events.listeners.get('storage')?.[0], listener2)
})

test('should flush unsaved changes on desist', async () => {
  const $counter = createStore(0, { name: 'counter' })
  const desist = persist({ store: $counter, timeout: 100 })

  //
  ;($counter as any).setState(1)
  assert.strictEqual($counter.getState(), 1)
  assert.strictEqual(global.localStorage.getItem('counter'), null) // <- not changed yet

  // stop persisting
  desist()

  assert.strictEqual(global.localStorage.getItem('counter'), '1') // changed immediately
})
