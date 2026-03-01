import { it, beforeAll, afterAll, vi, expect } from 'vitest'
import { createStore } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { type Events, createEventsMock } from './mocks/events.mock'
import { persist } from '../src/core'
import { storage } from '../src/storage'

//
// Mock abstract Storage and events
//

declare let global: any

const mockStorage = createStorageMock()
let events: Events

beforeAll(() => {
  vi.useFakeTimers()
  events = createEventsMock()
  global.addEventListener = events.addEventListener
  global.removeEventListener = events.removeEventListener
})

afterAll(() => {
  global.removeEventListener = undefined
  global.addEventListener = undefined
  vi.useRealTimers()
})

//
// Tests
//

it('value should be stored to storage after timeout', async () => {
  const $counter1 = createStore(0, { name: 'counter1' })
  persist({
    store: $counter1,
    adapter: storage({
      storage: () => mockStorage,
      timeout: 100,
    }),
  })
  expect($counter1.getState()).toBe(0)

  //
  ;($counter1 as any).setState(1)
  expect($counter1.getState()).toBe(1)
  expect(mockStorage.getItem('counter1')).toBe(null) // not changed yet

  vi.advanceTimersByTime(60)
  expect(mockStorage.getItem('counter1')).toBe(null) // not changed yet

  vi.advanceTimersByTime(60)
  expect(mockStorage.getItem('counter1')).toBe('1')
})

it('multiple store updates without timeout should call multiple storage update', () => {
  const setItem = vi.fn()
  const mockStorage = createStorageMock()
  mockStorage._callbacks({ setItem })

  const $counter2 = createStore(0, { name: 'counter2' })
  persist({
    store: $counter2,
    adapter: storage({ storage: () => mockStorage }),
  })

  for (let i = 1; i <= 10; i++) {
    ;($counter2 as any).setState(i)
  }
  expect($counter2.getState()).toBe(10)
  expect(mockStorage.getItem('counter2')).toBe('10')

  expect(setItem).toHaveBeenCalledTimes(10)
  for (let i = 1; i <= 10; i++) {
    expect(setItem.mock.calls[i - 1][0]).toBe('counter2')
    expect(setItem.mock.calls[i - 1][1]).toBe(String(i))
  }
})

it('multiple store updates with timeout should call single storage update', async () => {
  const setItem = vi.fn()
  const mockStorage = createStorageMock()
  mockStorage._callbacks({ setItem })

  const $counter3 = createStore(0, { name: 'counter3' })
  persist({
    store: $counter3,
    adapter: storage({
      storage: () => mockStorage,
      timeout: 0,
    }),
  })

  for (let i = 1; i <= 10; i++) {
    ;($counter3 as any).setState(i)
  }
  expect($counter3.getState()).toBe(10)

  expect(mockStorage.getItem('counter3')).toBe(null) // not changed yet
  expect(setItem).toHaveBeenCalledTimes(0) // not called yet

  vi.advanceTimersByTime(0)
  expect(mockStorage.getItem('counter3')).toBe('10')
  expect(setItem).toHaveBeenCalledTimes(1) // called once
  expect(setItem.mock.calls[0]).toEqual(['counter3', '10'])
})

it('should flush earlier on tab close', async () => {
  const $counter4 = createStore(0, { name: 'counter4' })
  persist({
    store: $counter4,
    adapter: storage({
      storage: () => mockStorage,
      timeout: 100,
    }),
  })

  //
  ;($counter4 as any).setState(1)
  expect($counter4.getState()).toBe(1)
  expect(mockStorage.getItem('counter4')).toBe(null) // not changed yet

  events.dispatchEvent('beforeunload', {})
  vi.advanceTimersByTime(0)
  expect(mockStorage.getItem('counter4')).toBe('1') // changed immediately
})

it('should not override value in case it came from other tab', async () => {
  const $counter5 = createStore(0, { name: 'counter5' })
  persist({
    store: $counter5,
    adapter: storage({
      storage: () => mockStorage,
      timeout: 100,
      sync: true,
    }),
  })

  //
  ;($counter5 as any).setState(1)
  expect($counter5.getState()).toBe(1)
  expect(mockStorage.getItem('counter5')).toBe(null) // not changed yet

  mockStorage.setItem('counter5', '2')
  events.dispatchEvent('storage', {
    storageArea: mockStorage,
    key: 'counter5',
    oldValue: null,
    newValue: '2',
  })
  vi.advanceTimersByTime(0)

  expect($counter5.getState()).toBe(2) // updated from storage
  expect(mockStorage.getItem('counter5')).toBe('2')

  // await for 150 ms
  vi.advanceTimersByTime(150)
  expect(mockStorage.getItem('counter5')).toBe('2') // should not be changed
})
