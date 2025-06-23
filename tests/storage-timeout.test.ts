import { test, before, after, mock } from 'node:test'
import * as assert from 'node:assert/strict'
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

before(() => {
  mock.timers.enable()
  events = createEventsMock()
  global.addEventListener = events.addEventListener
  global.removeEventListener = events.removeEventListener
})

after(() => {
  global.removeEventListener = undefined
  global.addEventListener = undefined
  mock.timers.reset()
})

//
// Tests
//

test('value should be stored to storage after timeout', async () => {
  const $counter1 = createStore(0, { name: 'counter1' })
  persist({
    store: $counter1,
    adapter: storage({
      storage: () => mockStorage,
      timeout: 100,
    }),
  })
  assert.strictEqual($counter1.getState(), 0)

  //
  ;($counter1 as any).setState(1)
  assert.strictEqual($counter1.getState(), 1)
  assert.strictEqual(mockStorage.getItem('counter1'), null) // not changed yet

  mock.timers.tick(60)
  assert.strictEqual(mockStorage.getItem('counter1'), null) // not changed yet

  mock.timers.tick(60)
  assert.strictEqual(mockStorage.getItem('counter1'), '1')
})

test('multiple store updates without timeout should call multiple storage update', () => {
  const setItem = mock.fn()
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
  assert.strictEqual($counter2.getState(), 10)
  assert.strictEqual(mockStorage.getItem('counter2'), '10')

  assert.strictEqual(setItem.mock.callCount(), 10)
  for (let i = 1; i <= 10; i++) {
    assert.strictEqual(
      setItem.mock.calls[i - 1].arguments[0 as any],
      'counter2'
    )
    assert.strictEqual(setItem.mock.calls[i - 1].arguments[1 as any], String(i))
  }
})

test('multiple store updates with timeout should call single storage update', async () => {
  const setItem = mock.fn()
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
  assert.strictEqual($counter3.getState(), 10)

  assert.strictEqual(mockStorage.getItem('counter3'), null) // not changed yet
  assert.strictEqual(setItem.mock.callCount(), 0) // not called yet

  mock.timers.tick(0)
  assert.strictEqual(mockStorage.getItem('counter3'), '10')
  assert.strictEqual(setItem.mock.callCount(), 1) // called once
  assert.deepEqual(setItem.mock.calls[0].arguments, ['counter3', '10'])
})

test('should flush earlier on tab close', async () => {
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
  assert.strictEqual($counter4.getState(), 1)
  assert.strictEqual(mockStorage.getItem('counter4'), null) // not changed yet

  events.dispatchEvent('beforeunload', {})
  mock.timers.tick(0)
  assert.strictEqual(mockStorage.getItem('counter4'), '1') // changed immediately
})

test('should not override value in case it came from other tab', async () => {
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
  assert.strictEqual($counter5.getState(), 1)
  assert.strictEqual(mockStorage.getItem('counter5'), null) // not changed yet

  mockStorage.setItem('counter5', '2')
  events.dispatchEvent('storage', {
    storageArea: mockStorage,
    key: 'counter5',
    oldValue: null,
    newValue: '2',
  })
  mock.timers.tick(0)

  assert.strictEqual($counter5.getState(), 2) // updated from storage
  assert.strictEqual(mockStorage.getItem('counter5'), '2')

  // await for 150 ms
  mock.timers.tick(150)
  assert.strictEqual(mockStorage.getItem('counter5'), '2') // should not be changed
})
