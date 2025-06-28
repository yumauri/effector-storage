import { test, before, after, mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { createEffect, createStore } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { type Events, createEventsMock } from './mocks/events.mock'
import { persist, createStorage } from '../src/local'

//
// Mock `localStorage` and events
//

declare let global: any
let events: Events

before(() => {
  global.localStorage = createStorageMock()
  events = createEventsMock()
  global.addEventListener = events.addEventListener
})

after(() => {
  global.localStorage = undefined
  global.addEventListener = undefined
})

//
// Tests
//

test('should get and set values in localStorage', async () => {
  const storage = createStorage<number>('test-key-1')

  assert.strictEqual(global.localStorage.getItem('test-key-1'), null)
  assert.strictEqual(await storage.getFx(), undefined)

  await storage.setFx(1)

  assert.strictEqual(global.localStorage.getItem('test-key-1'), '1')
  assert.strictEqual(await storage.getFx(), 1)
})

test('should be in sync with persisted store', async () => {
  const storage = createStorage<number>('test-key-2')

  const $value = createStore(0)
  persist({ store: $value, key: 'test-key-2' })

  // this is expected, because store initial value is not written to localStorage
  assert.strictEqual(await storage.getFx(), undefined)

  // set value to localStorage using createStorage effect
  await storage.setFx(1)

  // storage and persisted store should be updated
  assert.strictEqual(global.localStorage.getItem('test-key-2'), '1')
  assert.strictEqual($value.getState(), 1)

  const watch = mock.fn()
  storage.getFx.doneData.watch(watch)

  // set value to persisted store
  ;($value as any).setState(2)
  assert.strictEqual(global.localStorage.getItem('test-key-2'), '2')

  // createStorage effect should be called once
  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [2])
})

test('createStorage get effect should be called on storage event', async () => {
  const storage = createStorage<number>('test-key-3')

  const watch = mock.fn()
  storage.getFx.doneData.watch(watch)

  global.localStorage.setItem('test-key-3', '3')
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: 'test-key-3',
    oldValue: null,
    newValue: '3',
  })

  // createStorage effect should be called once
  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [3])
})

test.only('persisted store should be restored to initial value on delete effect', async () => {
  const storage = createStorage<number>('test-key-4')
  const $value = createStore(0)
  persist({
    store: $value,
    key: 'test-key-4',
    // def: 0,
    finally: createEffect((_: any) => console.log('🔵', _)),
  })
  assert.strictEqual(global.localStorage.getItem('test-key-4'), null)
  assert.strictEqual($value.getState(), 0)
  await storage.setFx(1)
  assert.strictEqual(global.localStorage.getItem('test-key-4'), '1')
  assert.strictEqual($value.getState(), 1)
  await storage.removeFx()
  assert.strictEqual(global.localStorage.getItem('test-key-4'), null)
  assert.strictEqual($value.getState(), 0)
})
