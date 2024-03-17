import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { type Snoop, snoop } from 'snoop'
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
let addListener: Snoop<Events['addEventListener']>
let removeListener: Snoop<Events['removeEventListener']>

test.before.each(() => {
  global.localStorage = createStorageMock()
  events = createEventsMock() as EventsMock

  addListener = snoop(events.addEventListener)
  global.addEventListener = addListener.fn

  removeListener = snoop(events.removeEventListener)
  global.removeEventListener = removeListener.fn
})

test.after.each(() => {
  delete global.localStorage
  delete global.addEventListener
  delete global.removeEventListener
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
  assert.is($counter.getState(), 1)

  // update storage via store change
  ;($counter as any).setState(2)
  assert.is(global.localStorage.getItem('counter'), '2')

  // stop persisting
  desist()

  // should not update storage via store change
  ;($counter as any).setState(3)
  assert.is(global.localStorage.getItem('counter'), '2') // <- not updated

  // should not update store via `storage` event
  global.localStorage.setItem('counter', '4')
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: 'counter',
    oldValue: '2',
    newValue: '4',
  })
  assert.is($counter.getState(), 3) // <- not updated
})

test('should remove `storage` event listener on desist', async () => {
  const $counter = createStore(0, { name: 'counter' })
  const desist = persist({ store: $counter })

  assert.is(addListener.callCount, 1)
  assert.equal(addListener.calls[0].arguments[0], 'storage')
  const listener = addListener.calls[0].arguments[1]

  assert.is(events.listeners.size, 1)
  assert.is(events.listeners.get('storage')?.length, 1)

  // stop persisting
  desist()

  assert.is(removeListener.callCount, 1)
  assert.equal(removeListener.calls[0].arguments[0], 'storage')
  assert.is(removeListener.calls[0].arguments[1], listener)

  assert.is(events.listeners.size, 1)
  assert.is(events.listeners.get('storage')?.length, 0)
})

test('should not remove other store `storage` event listener on desist', async () => {
  const $counter1 = createStore(0, { name: 'counter' })
  const desist1 = persist({ store: $counter1 })

  assert.is(addListener.callCount, 1)
  assert.equal(addListener.calls[0].arguments[0], 'storage')
  const listener1 = addListener.calls[0].arguments[1]

  const $counter2 = createStore(0, { name: 'counter' })
  persist({ store: $counter2 })

  assert.is(addListener.callCount, 2)
  assert.equal(addListener.calls[1].arguments[0], 'storage')
  const listener2 = addListener.calls[1].arguments[1]

  assert.is.not(listener1, listener2)

  assert.is(events.listeners.size, 1)
  assert.is(events.listeners.get('storage')?.length, 2)
  assert.is(events.listeners.get('storage')?.[0], listener1)
  assert.is(events.listeners.get('storage')?.[1], listener2)

  // stop persisting
  desist1()

  assert.is(removeListener.callCount, 1)
  assert.equal(removeListener.calls[0].arguments[0], 'storage')
  assert.is(removeListener.calls[0].arguments[1], listener1)

  assert.is(events.listeners.size, 1)
  assert.is(events.listeners.get('storage')?.length, 1)
  assert.is(events.listeners.get('storage')?.[0], listener2)
})

test('should flush unsaved changes on desist', async () => {
  const $counter = createStore(0, { name: 'counter' })
  const desist = persist({ store: $counter, timeout: 100 })

  //
  ;($counter as any).setState(1)
  assert.is($counter.getState(), 1)
  assert.is(global.localStorage.getItem('counter'), null) // <- not changed yet

  // stop persisting
  desist()

  assert.is(global.localStorage.getItem('counter'), '1') // changed immediately
})

//
// Launch tests
//

test.run()
