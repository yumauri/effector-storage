import type { Events } from './mocks/events.mock'
import { createEvent, createStore } from 'effector'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  it,
  vi,
} from 'vitest'
import { query as queryIndex } from '../src'
import {
  locationAssign,
  locationReplace,
  persist,
  pushState,
  query,
  replaceState,
} from '../src/query'
import { createEventsMock } from './mocks/events.mock'
import { createHistoryMock } from './mocks/history.mock'
import { createLocationMock } from './mocks/location.mock'

//
// Mock history, location and events
//

declare let global: any
let events: Events

beforeAll(() => {
  vi.useFakeTimers()
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

afterAll(() => {
  vi.useRealTimers()
})

//
// Tests
//

it('should export adapter and `persist` function', () => {
  expect(typeof query === 'function').toBeTruthy()
  expect(typeof persist === 'function').toBeTruthy()
  expect(typeof pushState === 'function').toBeTruthy()
  expect(typeof replaceState === 'function').toBeTruthy()
  expect(typeof locationAssign === 'function').toBeTruthy()
  expect(typeof locationReplace === 'function').toBeTruthy()
})

it('should be exported from package root', () => {
  expect(query).toBe(queryIndex)
})

it('should be ok on good parameters', () => {
  const $store = createStore('0', { name: 'query::store' })
  expect(() => persist({ store: $store })).not.toThrow()
})

it('store initial value should NOT be put in query string', () => {
  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  expect(global.location.search).toBe('')
})

it('store new value should be put in query string', () => {
  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  expect(global.location.search).toBe('')
  ;($id as any).setState('42')
  expect(global.location.search).toBe('?id=42')
})

it('should change store value to default, in case history go back', async () => {
  const $id = createStore('1212', { name: 'id' })
  persist({ store: $id })
  expect(global.location.search).toBe('')
  ;($id as any).setState('4242')
  expect(global.location.search).toBe('?id=4242')
  global.history.back()

  events.dispatchEvent('popstate', null)
  vi.runAllTimers()

  expect(global.location.search).toBe('')
  expect($id.getState()).toBe('1212')
})

it('store value should be set from query string', () => {
  global.history = createHistoryMock(null, '', 'http://domain.test?id=111')
  global.location = createLocationMock('http://domain.test?id=111')
  global.history._location(global.location)
  global.location._history(global.history)

  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  expect($id.getState()).toBe('111')
})

it('store delete query string parameter in case of store null value', () => {
  global.history = createHistoryMock(null, '', 'http://domain.test?id=7777')
  global.location = createLocationMock('http://domain.test?id=7777')
  global.history._location(global.location)
  global.location._history(global.history)

  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  expect($id.getState()).toBe('7777')
  ;($id as any).setState(null)
  expect(global.location.search).toBe('')
})

it('should preserve url hash part', () => {
  global.history = createHistoryMock(
    null,
    '',
    'http://domain.test?id=8888#test'
  )
  global.location = createLocationMock('http://domain.test?id=8888#test')
  global.history._location(global.location)
  global.location._history(global.history)

  expect(global.location.hash).toBe('#test')
  const $id = createStore('0', { name: 'id' })
  persist({ store: $id })
  expect($id.getState()).toBe('8888')
  ;($id as any).setState(null)
  expect(global.location.search).toBe('')
  expect(global.location.hash).toBe('#test')
  ;($id as any).setState('9999')
  expect(global.location.search).toBe('?id=9999')
  expect(global.location.hash).toBe('#test')
})

it('should use `pushState` by default', () => {
  const mockPushState = vi.fn()
  const mockReplaceState = vi.fn()
  const mockLocationAssign = vi.fn()
  const mockLocationReplace = vi.fn()
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
  expect(global.location.search).toBe('')
  expect(global.history.length).toBe(1)
  ;($id as any).setState('123')
  expect(global.location.search).toBe('?id=123')
  expect(global.history.length).toBe(2)

  expect(mockPushState).toHaveBeenCalledTimes(1)
  expect(mockReplaceState).toHaveBeenCalledTimes(0)
  expect(mockLocationAssign).toHaveBeenCalledTimes(0)
  expect(mockLocationReplace).toHaveBeenCalledTimes(0)

  expect(mockPushState.mock.calls[0]).toEqual([null, '', '/?id=123'])
})

it('should preserve state by default', () => {
  global.history = createHistoryMock({ test: 'test' }, '', 'http://domain.test')
  global.location = createLocationMock('http://domain.test')
  global.history._location(global.location)
  global.location._history(global.history)

  const mockPushState = vi.fn()
  const mockReplaceState = vi.fn()
  const mockLocationAssign = vi.fn()
  const mockLocationReplace = vi.fn()
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
  expect(global.location.search).toBe('')
  expect(global.history.length).toBe(1)
  ;($id as any).setState('111')
  expect(global.location.search).toBe('?id=111')
  expect(global.history.length).toBe(2)

  expect(mockPushState).toHaveBeenCalledTimes(1)
  expect(mockReplaceState).toHaveBeenCalledTimes(0)
  expect(mockLocationAssign).toHaveBeenCalledTimes(0)
  expect(mockLocationReplace).toHaveBeenCalledTimes(0)

  expect(mockPushState.mock.calls[0]).toEqual([
    { test: 'test' },
    '',
    '/?id=111',
  ])
})

it('should erase state if state="erase"', () => {
  global.history = createHistoryMock({ test: 'test' }, '', 'http://domain.test')
  global.location = createLocationMock('http://domain.test')
  global.history._location(global.location)
  global.location._history(global.history)

  const mockPushState = vi.fn()
  const mockReplaceState = vi.fn()
  const mockLocationAssign = vi.fn()
  const mockLocationReplace = vi.fn()
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
  expect(global.location.search).toBe('')
  expect(global.history.length).toBe(1)
  ;($id as any).setState('222')
  expect(global.location.search).toBe('?id=222')
  expect(global.history.length).toBe(2)

  expect(mockPushState).toHaveBeenCalledTimes(1)
  expect(mockReplaceState).toHaveBeenCalledTimes(0)
  expect(mockLocationAssign).toHaveBeenCalledTimes(0)
  expect(mockLocationReplace).toHaveBeenCalledTimes(0)

  expect(mockPushState.mock.calls[0]).toEqual([null, '', '/?id=222'])
})

it('use `pushState` explicitly', () => {
  const mockPushState = vi.fn()
  const mockReplaceState = vi.fn()
  const mockLocationAssign = vi.fn()
  const mockLocationReplace = vi.fn()
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
  expect(global.location.search).toBe('')
  expect(global.history.length).toBe(1)
  ;($id as any).setState('987')
  expect(global.location.search).toBe('?id=987')
  expect(global.history.length).toBe(2)

  expect(mockPushState).toHaveBeenCalledTimes(1)
  expect(mockReplaceState).toHaveBeenCalledTimes(0)
  expect(mockLocationAssign).toHaveBeenCalledTimes(0)
  expect(mockLocationReplace).toHaveBeenCalledTimes(0)

  expect(mockPushState.mock.calls[0]).toEqual([null, '', '/?id=987'])
})

it('use of `replaceState` explicitly', () => {
  const mockPushState = vi.fn()
  const mockReplaceState = vi.fn()
  const mockLocationAssign = vi.fn()
  const mockLocationReplace = vi.fn()
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
  expect(global.location.search).toBe('')
  expect(global.history.length).toBe(1)
  ;($id as any).setState('321')
  expect(global.location.search).toBe('?id=321')
  expect(global.history.length).toBe(1)

  expect(mockPushState).toHaveBeenCalledTimes(0)
  expect(mockReplaceState).toHaveBeenCalledTimes(1)
  expect(mockLocationAssign).toHaveBeenCalledTimes(0)
  expect(mockLocationReplace).toHaveBeenCalledTimes(0)

  expect(mockReplaceState.mock.calls[0]).toEqual([null, '', '/?id=321'])
})

it('`replaceState` should erase state if state="erase"', () => {
  global.history = createHistoryMock({ test: 'test' }, '', 'http://domain.test')
  global.location = createLocationMock('http://domain.test')
  global.history._location(global.location)
  global.location._history(global.history)

  const mockPushState = vi.fn()
  const mockReplaceState = vi.fn()
  const mockLocationAssign = vi.fn()
  const mockLocationReplace = vi.fn()
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
  expect(global.location.search).toBe('')
  expect(global.history.length).toBe(1)
  ;($id as any).setState('123123')
  expect(global.location.search).toBe('?id=123123')
  expect(global.history.length).toBe(1)

  expect(mockPushState).toHaveBeenCalledTimes(0)
  expect(mockReplaceState).toHaveBeenCalledTimes(1)
  expect(mockLocationAssign).toHaveBeenCalledTimes(0)
  expect(mockLocationReplace).toHaveBeenCalledTimes(0)

  expect(mockReplaceState.mock.calls[0]).toEqual([null, '', '/?id=123123'])
})

it('use of `locationAssign` explicitly', () => {
  const mockPushState = vi.fn()
  const mockReplaceState = vi.fn()
  const mockLocationAssign = vi.fn()
  const mockLocationReplace = vi.fn()
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
  expect(global.location.search).toBe('')
  expect(global.history.length).toBe(1)
  ;($id as any).setState('345')
  expect(global.location.search).toBe('?id=345')
  expect(global.history.length).toBe(2)

  expect(mockPushState).toHaveBeenCalledTimes(0)
  expect(mockReplaceState).toHaveBeenCalledTimes(0)
  expect(mockLocationAssign).toHaveBeenCalledTimes(1)
  expect(mockLocationReplace).toHaveBeenCalledTimes(0)

  expect(mockLocationAssign.mock.calls[0]).toEqual(['/?id=345'])
})

it('use of `locationReplace` explicitly', () => {
  const mockPushState = vi.fn()
  const mockReplaceState = vi.fn()
  const mockLocationAssign = vi.fn()
  const mockLocationReplace = vi.fn()
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
  expect(global.location.search).toBe('')
  expect(global.history.length).toBe(1)
  ;($id as any).setState('555')
  expect(global.location.search).toBe('?id=555')
  expect(global.history.length).toBe(1)

  expect(mockPushState).toHaveBeenCalledTimes(0)
  expect(mockReplaceState).toHaveBeenCalledTimes(0)
  expect(mockLocationAssign).toHaveBeenCalledTimes(0)
  expect(mockLocationReplace).toHaveBeenCalledTimes(1)

  expect(mockLocationReplace.mock.calls[0]).toEqual(['/?id=555'])
})

it('should work with source/target (issue #20)', () => {
  const watchSource = vi.fn()
  const watchTarget = vi.fn()

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
  expect(global.location.search).toBe('?id=20_1_1')
  expect(watchSource).toHaveBeenCalledTimes(0)
  expect(watchTarget).toHaveBeenCalledTimes(1)
  expect(watchTarget.mock.calls[0]).toEqual(['20_1_1'])

  // set new value to source -> should pass to query state
  source('20_1_2')

  expect(global.location.search).toBe('?id=20_1_2')
  expect(watchSource).toHaveBeenCalledTimes(1)
  expect(watchTarget).toHaveBeenCalledTimes(2)
  expect(watchSource.mock.calls[0]).toEqual(['20_1_2'])
  expect(watchTarget.mock.calls[1]).toEqual(['20_1_2'])
})

it('should work with source/target with default state (issue #20)', () => {
  const watchTarget = vi.fn()

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
  expect(global.location.search).toBe('')
  expect(watchTarget).toHaveBeenCalledTimes(1)
  expect(watchTarget.mock.calls[0]).toEqual(['20_2_0'])
})

it('should batch location updates (issue #23)', async () => {
  const mockPushState = vi.fn()
  global.history._callbacks({
    pushState: mockPushState,
  })

  const $page = createStore('1')
  const $count = createStore('25')

  persist({ store: $page, key: 'page', timeout: 0 })
  persist({ store: $count, key: 'count', timeout: 0 })

  expect(global.location.search).toBe('')
  expect(global.history.length).toBe(1)

  //
  ;($page as any).setState('2')
  ;($count as any).setState('20')

  vi.runAllTimers()
  expect(global.location.search).toBe('?page=2&count=20')
  expect(global.history.length).toBe(2) // <- sigle history record added
  expect(mockPushState).toHaveBeenCalledTimes(1) // <- single pushState call expecuted
  expect(mockPushState.mock.calls[0]).toEqual([null, '', '/?page=2&count=20'])
})

it('shortest timeout should take precedence (issue #23)', async () => {
  const mockPushState = vi.fn()
  global.history._callbacks({
    pushState: mockPushState,
  })

  const $page = createStore('1')
  const $count = createStore('25')

  persist({ store: $page, key: 'page', timeout: 1000 })
  persist({ store: $count, key: 'count', timeout: 100 })

  expect(global.location.search).toBe('')
  expect(global.history.length).toBe(1)

  //
  ;($page as any).setState('2')
  ;($count as any).setState('20')

  vi.advanceTimersByTime(70)
  expect(global.location.search).toBe('') // still nothing
  expect(global.history.length).toBe(1)

  vi.advanceTimersByTime(70)
  expect(global.location.search).toBe('?page=2&count=20')
  expect(global.history.length).toBe(2) // <- sigle history record added
  expect(mockPushState).toHaveBeenCalledTimes(1) // <- single pushState call expecuted
  expect(mockPushState.mock.calls[0]).toEqual([null, '', '/?page=2&count=20'])

  vi.advanceTimersByTime(5000)
  expect(mockPushState).toHaveBeenCalledTimes(1) // <- wasn't called again
})

it('store value should be serialized and deserialized', () => {
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
  expect($id.getState()).toBe(42)

  //
  ;($id as any).setState(12)
  expect(global.location.search).toBe('?id=12')
})

it('should stop react on history back after desist', async () => {
  const $id = createStore('12345', { name: 'id' })
  const desist = persist({ store: $id })
  expect(global.location.search).toBe('')
  ;($id as any).setState('54321')
  expect(global.location.search).toBe('?id=54321')

  // stop persisting
  desist()

  global.history.back()

  events.dispatchEvent('popstate', null)
  vi.runAllTimers()

  expect(global.location.search).toBe('')
  expect($id.getState()).toBe('54321') // <- not changed
})
