import { test, before, beforeEach, after, afterEach, mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { createStore, createEvent } from 'effector'
import { createHistoryMock } from './mocks/history.mock'
import { createLocationMock } from './mocks/location.mock'
import { type Events, createEventsMock } from './mocks/events.mock'
import {
  persist,
  query,
  createStorage,
  pushState,
  replaceState,
  locationAssign,
  locationReplace,
} from '../src/query'
import { query as queryIndex } from '../src'

//
// Mock history, location and events
//

declare let global: any
let events: Events

before(() => {
  mock.timers.enable()
})

beforeEach(() => {
  global.history = createHistoryMock(null, '', 'http://domain.test')
  global.location = createLocationMock('http://domain.test')
  global.history._location(global.location)
  global.location._history(global.history)
  events = createEventsMock()
  global.addEventListener = events.addEventListener
  global.removeEventListener = events.removeEventListener
})

afterEach(() => {
  global.history = undefined
  global.location = undefined
  global.addEventListener = undefined
  global.removeEventListener = undefined
})

after(() => {
  mock.timers.reset()
})

//
// Tests
//

test('should export adapter and `persist` function', () => {
  assert.ok(typeof query === 'function')
  assert.ok(typeof persist === 'function')
  assert.ok(typeof createStorage === 'function')
  assert.ok(typeof pushState === 'function')
  assert.ok(typeof replaceState === 'function')
  assert.ok(typeof locationAssign === 'function')
  assert.ok(typeof locationReplace === 'function')
})

test('should be exported from package root', () => {
  assert.strictEqual(query, queryIndex)
})

test('should be ok on good parameters', () => {
  const $store = createStore('0', { name: 'query::store' })
  assert.doesNotThrow(() => persist({ store: $store }))
  assert.doesNotThrow(() => createStorage('query::store'))
  assert.doesNotThrow(() => createStorage({ key: 'query::store' }))
})

test('store initial value should NOT be put in query string', () => {
  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  assert.strictEqual(global.location.search, '')
})

test('store new value should be put in query string', () => {
  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  assert.strictEqual(global.location.search, '')
  ;($id as any).setState('42')
  assert.strictEqual(global.location.search, '?id=42')
})

test('should change store value to default, in case history go back', async () => {
  const $id = createStore('1212', { name: 'id' })
  persist({ store: $id })
  assert.strictEqual(global.location.search, '')
  ;($id as any).setState('4242')
  assert.strictEqual(global.location.search, '?id=4242')
  global.history.back()

  events.dispatchEvent('popstate', null)
  mock.timers.runAll()

  assert.strictEqual(global.location.search, '')
  assert.strictEqual($id.getState(), '1212')
})

test('store value should be set from query string', () => {
  global.history = createHistoryMock(null, '', 'http://domain.test?id=111')
  global.location = createLocationMock('http://domain.test?id=111')
  global.history._location(global.location)
  global.location._history(global.history)

  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  assert.strictEqual($id.getState(), '111')
})

test('store delete query string parameter in case of store null value', () => {
  global.history = createHistoryMock(null, '', 'http://domain.test?id=7777')
  global.location = createLocationMock('http://domain.test?id=7777')
  global.history._location(global.location)
  global.location._history(global.history)

  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  assert.strictEqual($id.getState(), '7777')
  ;($id as any).setState(null)
  assert.strictEqual(global.location.search, '')
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

  assert.strictEqual(global.location.hash, '#test')
  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  assert.strictEqual($id.getState(), '8888')
  ;($id as any).setState(null)
  assert.strictEqual(global.location.search, '')
  assert.strictEqual(global.location.hash, '#test')
  ;($id as any).setState('9999')
  assert.strictEqual(global.location.search, '?id=9999')
  assert.strictEqual(global.location.hash, '#test')
})

test('should use `pushState` by default', () => {
  const mockPushState = mock.fn()
  const mockReplaceState = mock.fn()
  const mockLocationAssign = mock.fn()
  const mockLocationReplace = mock.fn()
  global.history._callbacks({
    pushState: mockPushState,
    replaceState: mockReplaceState,
  })
  global.location._callbacks({
    assign: mockLocationAssign,
    replace: mockLocationReplace,
  })

  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  assert.strictEqual(global.location.search, '')
  assert.strictEqual(global.history.length, 1)
  ;($id as any).setState('123')
  assert.strictEqual(global.location.search, '?id=123')
  assert.strictEqual(global.history.length, 2)

  assert.strictEqual(mockPushState.mock.callCount(), 1)
  assert.strictEqual(mockReplaceState.mock.callCount(), 0)
  assert.strictEqual(mockLocationAssign.mock.callCount(), 0)
  assert.strictEqual(mockLocationReplace.mock.callCount(), 0)

  assert.deepEqual(mockPushState.mock.calls[0].arguments, [
    null,
    '',
    '/?id=123',
  ])
})

test('should preserve state by default', () => {
  global.history = createHistoryMock({ test: 'test' }, '', 'http://domain.test')
  global.location = createLocationMock('http://domain.test')
  global.history._location(global.location)
  global.location._history(global.history)

  const mockPushState = mock.fn()
  const mockReplaceState = mock.fn()
  const mockLocationAssign = mock.fn()
  const mockLocationReplace = mock.fn()
  global.history._callbacks({
    pushState: mockPushState,
    replaceState: mockReplaceState,
  })
  global.location._callbacks({
    assign: mockLocationAssign,
    replace: mockLocationReplace,
  })

  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  assert.strictEqual(global.location.search, '')
  assert.strictEqual(global.history.length, 1)
  ;($id as any).setState('111')
  assert.strictEqual(global.location.search, '?id=111')
  assert.strictEqual(global.history.length, 2)

  assert.strictEqual(mockPushState.mock.callCount(), 1)
  assert.strictEqual(mockReplaceState.mock.callCount(), 0)
  assert.strictEqual(mockLocationAssign.mock.callCount(), 0)
  assert.strictEqual(mockLocationReplace.mock.callCount(), 0)

  assert.deepEqual(mockPushState.mock.calls[0].arguments, [
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

  const mockPushState = mock.fn()
  const mockReplaceState = mock.fn()
  const mockLocationAssign = mock.fn()
  const mockLocationReplace = mock.fn()
  global.history._callbacks({
    pushState: mockPushState,
    replaceState: mockReplaceState,
  })
  global.location._callbacks({
    assign: mockLocationAssign,
    replace: mockLocationReplace,
  })

  const $id = createStore('0', { name: 'id' })
  persist({ store: $id, state: 'erase' })
  assert.strictEqual(global.location.search, '')
  assert.strictEqual(global.history.length, 1)
  ;($id as any).setState('222')
  assert.strictEqual(global.location.search, '?id=222')
  assert.strictEqual(global.history.length, 2)

  assert.strictEqual(mockPushState.mock.callCount(), 1)
  assert.strictEqual(mockReplaceState.mock.callCount(), 0)
  assert.strictEqual(mockLocationAssign.mock.callCount(), 0)
  assert.strictEqual(mockLocationReplace.mock.callCount(), 0)

  assert.deepEqual(mockPushState.mock.calls[0].arguments, [
    null,
    '',
    '/?id=222',
  ])
})

test('use `pushState` explicitly', () => {
  const mockPushState = mock.fn()
  const mockReplaceState = mock.fn()
  const mockLocationAssign = mock.fn()
  const mockLocationReplace = mock.fn()
  global.history._callbacks({
    pushState: mockPushState,
    replaceState: mockReplaceState,
  })
  global.location._callbacks({
    assign: mockLocationAssign,
    replace: mockLocationReplace,
  })

  const $id = createStore('0', { name: 'id' })
  persist({ store: $id, method: pushState })
  assert.strictEqual(global.location.search, '')
  assert.strictEqual(global.history.length, 1)
  ;($id as any).setState('987')
  assert.strictEqual(global.location.search, '?id=987')
  assert.strictEqual(global.history.length, 2)

  assert.strictEqual(mockPushState.mock.callCount(), 1)
  assert.strictEqual(mockReplaceState.mock.callCount(), 0)
  assert.strictEqual(mockLocationAssign.mock.callCount(), 0)
  assert.strictEqual(mockLocationReplace.mock.callCount(), 0)

  assert.deepEqual(mockPushState.mock.calls[0].arguments, [
    null,
    '',
    '/?id=987',
  ])
})

test('use of `replaceState` explicitly', () => {
  const mockPushState = mock.fn()
  const mockReplaceState = mock.fn()
  const mockLocationAssign = mock.fn()
  const mockLocationReplace = mock.fn()
  global.history._callbacks({
    pushState: mockPushState,
    replaceState: mockReplaceState,
  })
  global.location._callbacks({
    assign: mockLocationAssign,
    replace: mockLocationReplace,
  })

  const $id = createStore('0', { name: 'id' })
  persist({ store: $id, method: replaceState })
  assert.strictEqual(global.location.search, '')
  assert.strictEqual(global.history.length, 1)
  ;($id as any).setState('321')
  assert.strictEqual(global.location.search, '?id=321')
  assert.strictEqual(global.history.length, 1)

  assert.strictEqual(mockPushState.mock.callCount(), 0)
  assert.strictEqual(mockReplaceState.mock.callCount(), 1)
  assert.strictEqual(mockLocationAssign.mock.callCount(), 0)
  assert.strictEqual(mockLocationReplace.mock.callCount(), 0)

  assert.deepEqual(mockReplaceState.mock.calls[0].arguments, [
    null,
    '',
    '/?id=321',
  ])
})

test('`replaceState` should erase state if state="erase"', () => {
  global.history = createHistoryMock({ test: 'test' }, '', 'http://domain.test')
  global.location = createLocationMock('http://domain.test')
  global.history._location(global.location)
  global.location._history(global.history)

  const mockPushState = mock.fn()
  const mockReplaceState = mock.fn()
  const mockLocationAssign = mock.fn()
  const mockLocationReplace = mock.fn()
  global.history._callbacks({
    pushState: mockPushState,
    replaceState: mockReplaceState,
  })
  global.location._callbacks({
    assign: mockLocationAssign,
    replace: mockLocationReplace,
  })

  const $id = createStore('0', { name: 'id' })
  persist({ store: $id, method: replaceState, state: 'erase' })
  assert.strictEqual(global.location.search, '')
  assert.strictEqual(global.history.length, 1)
  ;($id as any).setState('123123')
  assert.strictEqual(global.location.search, '?id=123123')
  assert.strictEqual(global.history.length, 1)

  assert.strictEqual(mockPushState.mock.callCount(), 0)
  assert.strictEqual(mockReplaceState.mock.callCount(), 1)
  assert.strictEqual(mockLocationAssign.mock.callCount(), 0)
  assert.strictEqual(mockLocationReplace.mock.callCount(), 0)

  assert.deepEqual(mockReplaceState.mock.calls[0].arguments, [
    null,
    '',
    '/?id=123123',
  ])
})

test('use of `locationAssign` explicitly', () => {
  const mockPushState = mock.fn()
  const mockReplaceState = mock.fn()
  const mockLocationAssign = mock.fn()
  const mockLocationReplace = mock.fn()
  global.history._callbacks({
    pushState: mockPushState,
    replaceState: mockReplaceState,
  })
  global.location._callbacks({
    assign: mockLocationAssign,
    replace: mockLocationReplace,
  })

  const $id = createStore('0', { name: 'id' })
  persist({ store: $id, method: locationAssign })
  assert.strictEqual(global.location.search, '')
  assert.strictEqual(global.history.length, 1)
  ;($id as any).setState('345')
  assert.strictEqual(global.location.search, '?id=345')
  assert.strictEqual(global.history.length, 2)

  assert.strictEqual(mockPushState.mock.callCount(), 0)
  assert.strictEqual(mockReplaceState.mock.callCount(), 0)
  assert.strictEqual(mockLocationAssign.mock.callCount(), 1)
  assert.strictEqual(mockLocationReplace.mock.callCount(), 0)

  assert.deepEqual(mockLocationAssign.mock.calls[0].arguments, ['/?id=345'])
})

test('use of `locationReplace` explicitly', () => {
  const mockPushState = mock.fn()
  const mockReplaceState = mock.fn()
  const mockLocationAssign = mock.fn()
  const mockLocationReplace = mock.fn()
  global.history._callbacks({
    pushState: mockPushState,
    replaceState: mockReplaceState,
  })
  global.location._callbacks({
    assign: mockLocationAssign,
    replace: mockLocationReplace,
  })

  const $id = createStore('0', { name: 'id' })
  persist({ store: $id, method: locationReplace })
  assert.strictEqual(global.location.search, '')
  assert.strictEqual(global.history.length, 1)
  ;($id as any).setState('555')
  assert.strictEqual(global.location.search, '?id=555')
  assert.strictEqual(global.history.length, 1)

  assert.strictEqual(mockPushState.mock.callCount(), 0)
  assert.strictEqual(mockReplaceState.mock.callCount(), 0)
  assert.strictEqual(mockLocationAssign.mock.callCount(), 0)
  assert.strictEqual(mockLocationReplace.mock.callCount(), 1)

  assert.deepEqual(mockLocationReplace.mock.calls[0].arguments, ['/?id=555'])
})

test('should work with source/target (issue #20)', () => {
  const watchSource = mock.fn()
  const watchTarget = mock.fn()

  global.history = createHistoryMock(null, '', 'http://domain.test?id=20_1_1')
  global.location = createLocationMock('http://domain.test?id=20_1_1')
  global.history._location(global.location)
  global.location._history(global.history)

  const source = createEvent<string>()
  const target = createEvent<string>()
  source.watch(watchSource)
  target.watch(watchTarget)

  persist({
    source,
    target,
    key: 'id',
  })

  // pass initial query state to target
  assert.strictEqual(global.location.search, '?id=20_1_1')
  assert.strictEqual(watchSource.mock.callCount(), 0)
  assert.strictEqual(watchTarget.mock.callCount(), 1)
  assert.deepEqual(watchTarget.mock.calls[0].arguments, ['20_1_1'])

  // set new value to source -> should pass to query state
  source('20_1_2')

  assert.strictEqual(global.location.search, '?id=20_1_2')
  assert.strictEqual(watchSource.mock.callCount(), 1)
  assert.strictEqual(watchTarget.mock.callCount(), 2)
  assert.deepEqual(watchSource.mock.calls[0].arguments, ['20_1_2'])
  assert.deepEqual(watchTarget.mock.calls[1].arguments, ['20_1_2'])
})

test('should work with source/target with default state (issue #20)', () => {
  const watchTarget = mock.fn()

  global.history = createHistoryMock(null, '', 'http://domain.test')
  global.location = createLocationMock('http://domain.test')
  global.history._location(global.location)
  global.location._history(global.history)

  const source = createEvent<string | null>()
  const target = createEvent<string | null>()
  target.watch(watchTarget)

  persist({
    source,
    target,
    key: 'id',
    def: '20_2_0',
  })

  // pass default value to target
  assert.strictEqual(global.location.search, '')
  assert.strictEqual(watchTarget.mock.callCount(), 1)
  assert.deepEqual(watchTarget.mock.calls[0].arguments, ['20_2_0'])
})

test('should batch location updates (issue #23)', async () => {
  const mockPushState = mock.fn()
  global.history._callbacks({
    pushState: mockPushState,
  })

  const $page = createStore('1')
  const $count = createStore('25')

  persist({ store: $page, key: 'page', timeout: 0 })
  persist({ store: $count, key: 'count', timeout: 0 })

  assert.strictEqual(global.location.search, '')
  assert.strictEqual(global.history.length, 1)

  //
  ;($page as any).setState('2')
  ;($count as any).setState('20')

  mock.timers.runAll()
  assert.strictEqual(global.location.search, '?page=2&count=20')
  assert.strictEqual(global.history.length, 2) // <- sigle history record added
  assert.strictEqual(mockPushState.mock.callCount(), 1) // <- single pushState call expecuted
  assert.deepEqual(mockPushState.mock.calls[0].arguments, [
    null,
    '',
    '/?page=2&count=20',
  ])
})

test('shortest timeout should take precedence (issue #23)', async () => {
  const mockPushState = mock.fn()
  global.history._callbacks({
    pushState: mockPushState,
  })

  const $page = createStore('1')
  const $count = createStore('25')

  persist({ store: $page, key: 'page', timeout: 1000 })
  persist({ store: $count, key: 'count', timeout: 100 })

  assert.strictEqual(global.location.search, '')
  assert.strictEqual(global.history.length, 1)

  //
  ;($page as any).setState('2')
  ;($count as any).setState('20')

  mock.timers.tick(70)
  assert.strictEqual(global.location.search, '') // still nothing
  assert.strictEqual(global.history.length, 1)

  mock.timers.tick(70)
  assert.strictEqual(global.location.search, '?page=2&count=20')
  assert.strictEqual(global.history.length, 2) // <- sigle history record added
  assert.strictEqual(mockPushState.mock.callCount(), 1) // <- single pushState call expecuted
  assert.deepEqual(mockPushState.mock.calls[0].arguments, [
    null,
    '',
    '/?page=2&count=20',
  ])

  mock.timers.tick(5000)
  assert.strictEqual(mockPushState.mock.callCount(), 1) // <- wasn't called again
})

test('store value should be serialized and deserialized', () => {
  global.history = createHistoryMock(null, '', 'http://domain.test?id=42')
  global.location = createLocationMock('http://domain.test?id=42')
  global.history._location(global.location)
  global.location._history(global.history)

  const $id = createStore<number | null>(null, { name: 'id' })
  persist({
    store: $id,
    serialize: (id) => String(id),
    deserialize: (id) => Number(id),
  })
  assert.strictEqual($id.getState(), 42)

  //
  ;($id as any).setState(12)
  assert.strictEqual(global.location.search, '?id=12')
})

test('should stop react on history back after desist', async () => {
  const $id = createStore('12345', { name: 'id' })
  const desist = persist({ store: $id })
  assert.strictEqual(global.location.search, '')
  ;($id as any).setState('54321')
  assert.strictEqual(global.location.search, '?id=54321')

  // stop persisting
  desist()

  global.history.back()

  events.dispatchEvent('popstate', null)
  mock.timers.runAll()

  assert.strictEqual(global.location.search, '')
  assert.strictEqual($id.getState(), '54321') // <- not changed
})
