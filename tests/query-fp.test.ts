import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createDomain, createStore, is } from 'effector'
import { createHistoryMock } from './mocks/history.mock'
import { createLocationMock } from './mocks/location.mock'
import { createEventsMock } from './mocks/events.mock'
import {
  persist,
  pushState,
  replaceState,
  locationAssign,
  locationReplace,
} from '../src/query/fp'

//
// Mock Storage adapter and events
//

declare let global: any
let events: ReturnType<typeof createEventsMock>

test.before.each(() => {
  global.history = createHistoryMock(null, '', 'http://domain.test')
  global.location = createLocationMock('http://domain.test')
  global.history._location(global.location)
  global.location._history(global.history)
  events = createEventsMock()
  global.addEventListener = events.addEventListener
})

test.after.each(() => {
  delete global.history
  delete global.location
  delete global.addEventListener
})

//
// Tests
//

test('should export adapter and `persist` function', () => {
  assert.type(persist, 'function')
  assert.type(pushState, 'function')
  assert.type(replaceState, 'function')
  assert.type(locationAssign, 'function')
  assert.type(locationReplace, 'function')
})

test('should be ok on good parameters', () => {
  const $store = createStore(0, { name: 'query-fp::store' })
  assert.not.throws(() => persist()($store))
})

test('should return Store', () => {
  const $store0 = createStore(0)
  const $store1 = persist({ key: 'query-fp::store0' })($store0)
  assert.ok(is.store($store1))
  assert.ok($store1 === $store0)
})

test('should be possible to use with .thru()', () => {
  global.history = createHistoryMock(null, '', 'http://domain.test?id=332211')
  global.location = createLocationMock('http://domain.test?id=332211')
  global.history._location(global.location)
  global.location._history(global.history)

  const watch = snoop(() => undefined)

  const $id = createStore('0').thru(persist({ key: 'id' }))
  $id.watch(watch.fn)

  // call watcher once
  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, ['332211'])
})

test('should be possible to use with domain hook', () => {
  global.history = createHistoryMock(null, '', 'http://domain.test?id=443322')
  global.location = createLocationMock('http://domain.test?id=443322')
  global.history._location(global.location)
  global.location._history(global.history)

  const watch = snoop(() => undefined)
  const root = createDomain()
  root.onCreateStore(persist())

  const $id = root.createStore('0', { name: 'id' })
  $id.watch(watch.fn)

  // call watcher once
  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, ['443322'])
})

//
// Launch tests
//

test.run()
