import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { createStore } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { createEventsMock } from './mocks/events.mock'
import { createPersist } from '../src/local'

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

//
// Tests
//

test('key should be prefixed with keyPrefix', async () => {
  const persist = createPersist({
    keyPrefix: 'app/',
  })

  const $counter = createStore(0, { name: 'counter' })
  persist({ store: $counter })
  assert.is($counter.getState(), 0)

  //
  ;($counter as any).setState(1)
  assert.is(global.localStorage.getItem('counter'), null)
  assert.is(global.localStorage.getItem('app/counter'), '1')

  global.localStorage.setItem('app/counter', '2')
  await events.dispatchEvent('storage', {
    storageArea: global.localStorage,
    key: 'app/counter',
    oldValue: null,
    newValue: '2',
  })

  assert.is($counter.getState(), 2)
})

//
// Launch tests
//

test.run()
