import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore, createEvent } from 'effector'
import { createHistoryMock } from './mocks/history.mock'
import { createLocationMock } from './mocks/location.mock'
import { createEventsMock } from './mocks/events.mock'
import {
  persist,
  pushState,
  replaceState,
  locationAssign,
  locationReplace,
} from '../src/query'

//
// Mock history, location and events
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
  const $store = createStore('0', { name: 'query::store' })
  assert.not.throws(() => persist({ store: $store }))
})

test('store initial value should NOT be put in query string', () => {
  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  assert.is(global.location.search, '')
})

test('store new value should be put in query string', () => {
  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  assert.is(global.location.search, '')
  ;($id as any).setState('42')
  assert.is(global.location.search, '?id=42')
})

test('should change store value to default, in case history go back', async () => {
  const $id = createStore('1212', { name: 'id' })
  persist({ store: $id })
  assert.is(global.location.search, '')
  ;($id as any).setState('4242')
  assert.is(global.location.search, '?id=4242')
  global.history.back()

  await events.dispatchEvent('popstate', null)
  await new Promise((resolve) => setTimeout(resolve, 10))

  assert.is(global.location.search, '')
  assert.is($id.getState(), '1212')
})

test('store value should be set from query string', () => {
  global.history = createHistoryMock(null, '', 'http://domain.test?id=111')
  global.location = createLocationMock('http://domain.test?id=111')
  global.history._location(global.location)
  global.location._history(global.history)

  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  assert.is($id.getState(), '111')
})

test('store delete query string parameter in case of store null value', () => {
  global.history = createHistoryMock(null, '', 'http://domain.test?id=7777')
  global.location = createLocationMock('http://domain.test?id=7777')
  global.history._location(global.location)
  global.location._history(global.history)

  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  assert.is($id.getState(), '7777')
  ;($id as any).setState(null)
  assert.is(global.location.search, '')
})

test('should preserve url hash part', () => {
  global.history = createHistoryMock(
    null,
    '',
    'http://domain.test?id=8888#test'
  )
  global.location = createLocationMock('http://domain.test?id=8888#test')
  global.history._location(global.location)
  global.location._history(global.history)

  assert.is(global.location.hash, '#test')
  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  assert.is($id.getState(), '8888')
  ;($id as any).setState(null)
  assert.is(global.location.search, '')
  assert.is(global.location.hash, '#test')
  ;($id as any).setState('9999')
  assert.is(global.location.search, '?id=9999')
  assert.is(global.location.hash, '#test')
})

test('should use `pushState` by default', () => {
  const snoopPushState = snoop(() => undefined)
  const snoopReplaceState = snoop(() => undefined)
  const snoopLocationAssign = snoop(() => undefined)
  const snoopLocationReplace = snoop(() => undefined)
  global.history._callbacks({
    pushState: snoopPushState.fn,
    replaceState: snoopReplaceState.fn,
  })
  global.location._callbacks({
    assign: snoopLocationAssign.fn,
    replace: snoopLocationReplace.fn,
  })

  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  assert.is(global.location.search, '')
  assert.is(global.history.length, 1)
  ;($id as any).setState('123')
  assert.is(global.location.search, '?id=123')
  assert.is(global.history.length, 2)

  assert.is(snoopPushState.callCount, 1)
  assert.is(snoopReplaceState.callCount, 0)
  assert.is(snoopLocationAssign.callCount, 0)
  assert.is(snoopLocationReplace.callCount, 0)

  assert.equal(snoopPushState.calls[0].arguments, [null, '', '/?id=123'])
})

test('should preserve state by default', () => {
  global.history = createHistoryMock({ test: 'test' }, '', 'http://domain.test')
  global.location = createLocationMock('http://domain.test')
  global.history._location(global.location)
  global.location._history(global.history)

  const snoopPushState = snoop(() => undefined)
  const snoopReplaceState = snoop(() => undefined)
  const snoopLocationAssign = snoop(() => undefined)
  const snoopLocationReplace = snoop(() => undefined)
  global.history._callbacks({
    pushState: snoopPushState.fn,
    replaceState: snoopReplaceState.fn,
  })
  global.location._callbacks({
    assign: snoopLocationAssign.fn,
    replace: snoopLocationReplace.fn,
  })

  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  assert.is(global.location.search, '')
  assert.is(global.history.length, 1)
  ;($id as any).setState('111')
  assert.is(global.location.search, '?id=111')
  assert.is(global.history.length, 2)

  assert.is(snoopPushState.callCount, 1)
  assert.is(snoopReplaceState.callCount, 0)
  assert.is(snoopLocationAssign.callCount, 0)
  assert.is(snoopLocationReplace.callCount, 0)

  assert.equal(snoopPushState.calls[0].arguments, [
    { test: 'test' },
    '',
    '/?id=111',
  ])
})

test('should erase state if state="erase"', () => {
  global.history = createHistoryMock({ test: 'test' }, '', 'http://domain.test')
  global.location = createLocationMock('http://domain.test')
  global.history._location(global.location)
  global.location._history(global.history)

  const snoopPushState = snoop(() => undefined)
  const snoopReplaceState = snoop(() => undefined)
  const snoopLocationAssign = snoop(() => undefined)
  const snoopLocationReplace = snoop(() => undefined)
  global.history._callbacks({
    pushState: snoopPushState.fn,
    replaceState: snoopReplaceState.fn,
  })
  global.location._callbacks({
    assign: snoopLocationAssign.fn,
    replace: snoopLocationReplace.fn,
  })

  const $id = createStore('0', { name: 'id' })
  persist({ store: $id, state: 'erase' })
  assert.is(global.location.search, '')
  assert.is(global.history.length, 1)
  ;($id as any).setState('222')
  assert.is(global.location.search, '?id=222')
  assert.is(global.history.length, 2)

  assert.is(snoopPushState.callCount, 1)
  assert.is(snoopReplaceState.callCount, 0)
  assert.is(snoopLocationAssign.callCount, 0)
  assert.is(snoopLocationReplace.callCount, 0)

  assert.equal(snoopPushState.calls[0].arguments, [null, '', '/?id=222'])
})

test('use `pushState` explicitly', () => {
  const snoopPushState = snoop(() => undefined)
  const snoopReplaceState = snoop(() => undefined)
  const snoopLocationAssign = snoop(() => undefined)
  const snoopLocationReplace = snoop(() => undefined)
  global.history._callbacks({
    pushState: snoopPushState.fn,
    replaceState: snoopReplaceState.fn,
  })
  global.location._callbacks({
    assign: snoopLocationAssign.fn,
    replace: snoopLocationReplace.fn,
  })

  const $id = createStore('0', { name: 'id' })
  persist({ store: $id, method: pushState })
  assert.is(global.location.search, '')
  assert.is(global.history.length, 1)
  ;($id as any).setState('987')
  assert.is(global.location.search, '?id=987')
  assert.is(global.history.length, 2)

  assert.is(snoopPushState.callCount, 1)
  assert.is(snoopReplaceState.callCount, 0)
  assert.is(snoopLocationAssign.callCount, 0)
  assert.is(snoopLocationReplace.callCount, 0)

  assert.equal(snoopPushState.calls[0].arguments, [null, '', '/?id=987'])
})

test('use of `replaceState` explicitly', () => {
  const snoopPushState = snoop(() => undefined)
  const snoopReplaceState = snoop(() => undefined)
  const snoopLocationAssign = snoop(() => undefined)
  const snoopLocationReplace = snoop(() => undefined)
  global.history._callbacks({
    pushState: snoopPushState.fn,
    replaceState: snoopReplaceState.fn,
  })
  global.location._callbacks({
    assign: snoopLocationAssign.fn,
    replace: snoopLocationReplace.fn,
  })

  const $id = createStore('0', { name: 'id' })
  persist({ store: $id, method: replaceState })
  assert.is(global.location.search, '')
  assert.is(global.history.length, 1)
  ;($id as any).setState('321')
  assert.is(global.location.search, '?id=321')
  assert.is(global.history.length, 1)

  assert.is(snoopPushState.callCount, 0)
  assert.is(snoopReplaceState.callCount, 1)
  assert.is(snoopLocationAssign.callCount, 0)
  assert.is(snoopLocationReplace.callCount, 0)

  assert.equal(snoopReplaceState.calls[0].arguments, [null, '', '/?id=321'])
})

test('`replaceState` should erase state if state="erase"', () => {
  global.history = createHistoryMock({ test: 'test' }, '', 'http://domain.test')
  global.location = createLocationMock('http://domain.test')
  global.history._location(global.location)
  global.location._history(global.history)

  const snoopPushState = snoop(() => undefined)
  const snoopReplaceState = snoop(() => undefined)
  const snoopLocationAssign = snoop(() => undefined)
  const snoopLocationReplace = snoop(() => undefined)
  global.history._callbacks({
    pushState: snoopPushState.fn,
    replaceState: snoopReplaceState.fn,
  })
  global.location._callbacks({
    assign: snoopLocationAssign.fn,
    replace: snoopLocationReplace.fn,
  })

  const $id = createStore('0', { name: 'id' })
  persist({ store: $id, method: replaceState, state: 'erase' })
  assert.is(global.location.search, '')
  assert.is(global.history.length, 1)
  ;($id as any).setState('123123')
  assert.is(global.location.search, '?id=123123')
  assert.is(global.history.length, 1)

  assert.is(snoopPushState.callCount, 0)
  assert.is(snoopReplaceState.callCount, 1)
  assert.is(snoopLocationAssign.callCount, 0)
  assert.is(snoopLocationReplace.callCount, 0)

  assert.equal(snoopReplaceState.calls[0].arguments, [null, '', '/?id=123123'])
})

test('use of `locationAssign` explicitly', () => {
  const snoopPushState = snoop(() => undefined)
  const snoopReplaceState = snoop(() => undefined)
  const snoopLocationAssign = snoop(() => undefined)
  const snoopLocationReplace = snoop(() => undefined)
  global.history._callbacks({
    pushState: snoopPushState.fn,
    replaceState: snoopReplaceState.fn,
  })
  global.location._callbacks({
    assign: snoopLocationAssign.fn,
    replace: snoopLocationReplace.fn,
  })

  const $id = createStore('0', { name: 'id' })
  persist({ store: $id, method: locationAssign })
  assert.is(global.location.search, '')
  assert.is(global.history.length, 1)
  ;($id as any).setState('345')
  assert.is(global.location.search, '?id=345')
  assert.is(global.history.length, 2)

  assert.is(snoopPushState.callCount, 0)
  assert.is(snoopReplaceState.callCount, 0)
  assert.is(snoopLocationAssign.callCount, 1)
  assert.is(snoopLocationReplace.callCount, 0)

  assert.equal(snoopLocationAssign.calls[0].arguments, ['/?id=345'])
})

test('use of `locationReplace` explicitly', () => {
  const snoopPushState = snoop(() => undefined)
  const snoopReplaceState = snoop(() => undefined)
  const snoopLocationAssign = snoop(() => undefined)
  const snoopLocationReplace = snoop(() => undefined)
  global.history._callbacks({
    pushState: snoopPushState.fn,
    replaceState: snoopReplaceState.fn,
  })
  global.location._callbacks({
    assign: snoopLocationAssign.fn,
    replace: snoopLocationReplace.fn,
  })

  const $id = createStore('0', { name: 'id' })
  persist({ store: $id, method: locationReplace })
  assert.is(global.location.search, '')
  assert.is(global.history.length, 1)
  ;($id as any).setState('555')
  assert.is(global.location.search, '?id=555')
  assert.is(global.history.length, 1)

  assert.is(snoopPushState.callCount, 0)
  assert.is(snoopReplaceState.callCount, 0)
  assert.is(snoopLocationAssign.callCount, 0)
  assert.is(snoopLocationReplace.callCount, 1)

  assert.equal(snoopLocationReplace.calls[0].arguments, ['/?id=555'])
})

test('should work with source/target (issue #20)', () => {
  const watchSource = snoop(() => undefined)
  const watchTarget = snoop(() => undefined)

  global.history = createHistoryMock(null, '', 'http://domain.test?id=20_1_1')
  global.location = createLocationMock('http://domain.test?id=20_1_1')
  global.history._location(global.location)
  global.location._history(global.history)

  const source = createEvent<string>()
  const target = createEvent<string>()
  source.watch(watchSource.fn)
  target.watch(watchTarget.fn)

  persist({
    source,
    target,
    key: 'id',
  })

  // pass initial query state to target
  assert.is(global.location.search, '?id=20_1_1')
  assert.is(watchSource.callCount, 0)
  assert.is(watchTarget.callCount, 2) // first and second // fix later?
  assert.equal(watchTarget.calls[0].arguments, ['20_1_1'])
  assert.equal(watchTarget.calls[1].arguments, ['20_1_1'])

  // set new value to source -> should pass to query state
  source('20_1_2')

  assert.is(global.location.search, '?id=20_1_2')
  assert.is(watchSource.callCount, 1)
  assert.is(watchTarget.callCount, 3)
  assert.equal(watchSource.calls[0].arguments, ['20_1_2'])
  assert.equal(watchTarget.calls[2].arguments, ['20_1_2'])
})

test('should work with source/target with default state (issue #20)', () => {
  const watchTarget = snoop(() => undefined)

  global.history = createHistoryMock(null, '', 'http://domain.test')
  global.location = createLocationMock('http://domain.test')
  global.history._location(global.location)
  global.location._history(global.history)

  const source = createEvent<string | null>()
  const target = createEvent<string | null>()
  target.watch(watchTarget.fn)

  persist({
    source,
    target,
    key: 'id',
    def: '20_2_0',
  })

  // pass default value to target
  assert.is(global.location.search, '')
  assert.is(watchTarget.callCount, 2) // first and second // fix later?
  assert.equal(watchTarget.calls[0].arguments, ['20_2_0'])
  assert.equal(watchTarget.calls[1].arguments, ['20_2_0'])
})

//
// Launch tests
//

test.run()
