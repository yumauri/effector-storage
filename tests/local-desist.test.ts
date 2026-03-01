import type { Mock } from 'vitest'
import type { Events, EventsMock } from './mocks/events.mock'
import { createStore } from 'effector'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { persist } from '../src/local'
import { createEventsMock } from './mocks/events.mock'
import { createStorageMock } from './mocks/storage.mock'

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

  addListener = vi.fn(events.addEventListener)
  global.addEventListener = addListener

  removeListener = vi.fn(events.removeEventListener)
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

it('should stop persisting on desist', async () => {
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
  expect($counter.getState()).toBe(1)

  // update storage via store change
  ;($counter as any).setState(2)
  expect(global.localStorage.getItem('counter')).toBe('2')

  // stop persisting
  desist()

  // should not update storage via store change
  ;($counter as any).setState(3)
  expect(global.localStorage.getItem('counter')).toBe('2') // <- not updated

  // should not update store via `storage` event
  global.localStorage.setItem('counter', '4')
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: 'counter',
    oldValue: '2',
    newValue: '4',
  })
  expect($counter.getState()).toBe(3) // <- not updated
})

it('should remove `storage` event listener on desist', async () => {
  const $counter = createStore(0, { name: 'counter' })
  const desist = persist({ store: $counter })

  expect(addListener).toHaveBeenCalledTimes(1)
  expect(addListener.mock.calls[0][0]).toBe('storage')
  const listener = addListener.mock.calls[0][1]

  expect(events.listeners.size).toBe(1)
  expect(events.listeners.get('storage')?.length).toBe(1)

  // stop persisting
  desist()

  expect(removeListener).toHaveBeenCalledTimes(1)
  expect(removeListener.mock.calls[0][0]).toBe('storage')
  expect(removeListener.mock.calls[0][1]).toBe(listener)

  expect(events.listeners.size).toBe(1)
  expect(events.listeners.get('storage')?.length).toBe(0)
})

it('should not remove other store `storage` event listener on desist', async () => {
  const $counter1 = createStore(0, { name: 'counter' })
  const desist1 = persist({ store: $counter1 })

  expect(addListener).toHaveBeenCalledTimes(1)
  expect(addListener.mock.calls[0][0]).toBe('storage')
  const listener1 = addListener.mock.calls[0][1]

  const $counter2 = createStore(0, { name: 'counter' })
  persist({ store: $counter2 })

  expect(addListener).toHaveBeenCalledTimes(2)
  expect(addListener.mock.calls[1][0]).toBe('storage')
  const listener2 = addListener.mock.calls[1][1]

  expect(listener1).not.toBe(listener2)

  expect(events.listeners.size).toBe(1)
  expect(events.listeners.get('storage')?.length).toBe(2)
  expect(events.listeners.get('storage')?.[0]).toBe(listener1)
  expect(events.listeners.get('storage')?.[1]).toBe(listener2)

  // stop persisting
  desist1()

  expect(removeListener).toHaveBeenCalledTimes(1)
  expect(removeListener.mock.calls[0][0]).toBe('storage')
  expect(removeListener.mock.calls[0][1]).toBe(listener1)

  expect(events.listeners.size).toBe(1)
  expect(events.listeners.get('storage')?.length).toBe(1)
  expect(events.listeners.get('storage')?.[0]).toBe(listener2)
})

it('should flush unsaved changes on desist', async () => {
  const $counter = createStore(0, { name: 'counter' })
  const desist = persist({ store: $counter, timeout: 100 })

  //
  ;($counter as any).setState(1)
  expect($counter.getState()).toBe(1)
  expect(global.localStorage.getItem('counter')).toBe(null) // <- not changed yet

  // stop persisting
  desist()

  expect(global.localStorage.getItem('counter')).toBe('1') // changed immediately
})
