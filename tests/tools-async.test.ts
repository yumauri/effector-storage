import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createEvent, createStore } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { createEventsMock } from './mocks/events.mock'
import { persist } from '../src/core'
import { local } from '../src/local'
import { async } from '../src/tools'

//
// Mock `localStorage` and events
//

declare let global: any
let events: ReturnType<typeof createEventsMock>

test.before(() => {
  global.localStorage = createStorageMock()
  events = createEventsMock()
  global.addEventListener = events.addEventListener
})

test.after(() => {
  delete global.localStorage
  delete global.addEventListener
})

const timeout = (t: number) => new Promise((resolve) => setTimeout(resolve, t))

//
// Tests
//

test('store should be asynchronously initialized from storage value', async () => {
  const $counter1 = createStore(1, { name: 'counter1' })
  global.localStorage.setItem('counter1', '42')

  persist({
    adapter: async(local()),
    store: $counter1,
  })

  assert.is($counter1.getState(), 1)
  await timeout(0)
  assert.is($counter1.getState(), 42)
})

test('store new value should be asynchronously saved to storage', async () => {
  const $counter2 = createStore(0, { name: 'counter2' })

  persist({
    adapter: async(local()),
    store: $counter2,
  })

  //
  ;($counter2 as any).setState(22)
  assert.is(global.localStorage.getItem('counter2'), null) // <- not saved yet

  await timeout(0)
  assert.is(global.localStorage.getItem('counter2'), '22') // <- saved
})

test('all synchronous operations should be done before `done` event', async () => {
  const watch = snoop(() => undefined)

  const done = createEvent<any>()

  global.localStorage.setItem('data', '"changed"')
  const $data = createStore('initial', { name: 'data' })

  persist({
    adapter: async(local()),
    store: $data,
    done,
  })

  // add watcher AFTER persist
  done.watch(watch.fn)
  assert.is(watch.callCount, 0)
  assert.is($data.getState(), 'initial')

  // awaits for next tick
  await timeout(0)
  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [
    {
      key: 'data',
      keyPrefix: '',
      operation: 'get',
      value: 'changed',
    },
  ])
  assert.is($data.getState(), 'changed')
})

//
// Launch tests
//

test.run()
