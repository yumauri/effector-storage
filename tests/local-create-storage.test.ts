import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createEffect, createStore } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { type Events, createEventsMock } from './mocks/events.mock'
import { persist, createStorage } from '../src/local'

//
// Mock `localStorage` and events
//

declare let global: any
let events: Events

test.before(() => {
  global.localStorage = createStorageMock()
  events = createEventsMock()
  global.addEventListener = events.addEventListener
})

test.after(() => {
  global.localStorage = undefined
  global.addEventListener = undefined
})

//
// Tests
//

test('should get and set values in localStorage', async () => {
  const storage = createStorage<number>('test-key-1')

  assert.is(global.localStorage.getItem('test-key-1'), null)
  assert.is(await storage.getFx(), undefined)

  await storage.setFx(1)

  assert.is(global.localStorage.getItem('test-key-1'), '1')
  assert.is(await storage.getFx(), 1)
})

test('should be in sync with persisted store', async () => {
  const storage = createStorage<number>('test-key-2')

  const $value = createStore(0)
  persist({ store: $value, key: 'test-key-2' })

  // this is expected, because store initial value is not written to localStorage
  assert.is(await storage.getFx(), undefined)

  // set value to localStorage using createStorage effect
  await storage.setFx(1)

  // storage and persisted store should be updated
  assert.is(global.localStorage.getItem('test-key-2'), '1')
  assert.is($value.getState(), 1)

  const watch = snoop(() => undefined)
  storage.getFx.doneData.watch(watch.fn)

  // set value to persisted store
  ;($value as any).setState(2)
  assert.is(global.localStorage.getItem('test-key-2'), '2')

  // createStorage effect should be called once
  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [2])
})

test('createStorage get effect should be called on storage event', async () => {
  const storage = createStorage<number>('test-key-3')

  const watch = snoop(() => undefined)
  storage.getFx.doneData.watch(watch.fn)

  global.localStorage.setItem('test-key-3', '3')
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: 'test-key-3',
    oldValue: null,
    newValue: '3',
  })

  // createStorage effect should be called once
  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [3])
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
  assert.is(global.localStorage.getItem('test-key-4'), null)
  assert.is($value.getState(), 0)
  await storage.setFx(1)
  assert.is(global.localStorage.getItem('test-key-4'), '1')
  assert.is($value.getState(), 1)
  await storage.removeFx()
  assert.is(global.localStorage.getItem('test-key-4'), null)
  assert.is($value.getState(), 0)
})

//
// Launch tests
//

test.run()
