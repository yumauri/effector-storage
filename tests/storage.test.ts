import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore, createEvent, forward } from 'effector'
import { tie, sink } from '../src'
import { storage } from '../src/storage'
import { createStorageMock } from './mocks/storage.mock'

//
// Mock Storage adapter
//

const mockStorage = createStorageMock()
const storageAdapter = storage(mockStorage, false)

//
// Tests
//

test('store initial value should NOT be saved to storage', () => {
  const counter1$ = createStore(0, { name: 'counter1' })
  tie({ store: counter1$, with: storageAdapter })
  assert.is(mockStorage.getItem('counter1'), null)
  assert.is(counter1$.getState(), 0)
})

test('store new value should be saved to storage', () => {
  const counter2$ = createStore(0, { name: 'counter2' })
  tie({ store: counter2$, with: storageAdapter })
  assert.is(mockStorage.getItem('counter2'), null)
  ;(counter2$ as any).setState(3)
  assert.is(mockStorage.getItem('counter2'), '3')
  assert.is(counter2$.getState(), JSON.parse(mockStorage.getItem('counter2') as any))
})

test('key should have precedence over name', () => {
  const namekey$ = createStore(0, { name: 'precedence::name' })
  tie({ store: namekey$, with: storageAdapter, key: 'precedence::key' })
  assert.is(mockStorage.getItem('precedence::name'), null)
  assert.is(mockStorage.getItem('precedence::key'), null)
  ;(namekey$ as any).setState(42)
  assert.is(mockStorage.getItem('precedence::name'), null)
  assert.is(mockStorage.getItem('precedence::key'), '42')
})

test('store should be initialized from storage value', () => {
  mockStorage.setItem('counter3', '42')
  const counter3$ = createStore(0, { name: 'counter3' })
  tie({ store: counter3$, with: storageAdapter })
  assert.is(mockStorage.getItem('counter3'), '42')
  assert.is(counter3$.getState(), 42)
})

test('reset store should reset it to given initial value', () => {
  mockStorage.setItem('counter4', '42')
  const reset = createEvent()
  const counter4$ = createStore(0, { name: 'counter4' }).reset(reset)
  tie({ store: counter4$, with: storageAdapter })
  assert.is(mockStorage.getItem('counter4'), '42')
  assert.is(counter4$.getState(), 42)
  reset()
  assert.is(mockStorage.getItem('counter4'), '0')
  assert.is(counter4$.getState(), 0)
})

test('broken storage value should be ignored', () => {
  mockStorage.setItem('counter5', 'broken')
  const counter5$ = createStore(13, { name: 'counter5' })
  tie({ store: counter5$, with: storageAdapter })
  assert.is(mockStorage.getItem('counter5'), 'broken')
  assert.is(counter5$.getState(), 13)
})

test('broken storage value should launch `catch` handler', () => {
  const handler = createEvent<any>()
  const watch = snoop(() => undefined)
  handler.watch(watch.fn)

  mockStorage.setItem('counter6', 'broken')
  const counter6$ = createStore(13, { name: 'counter6' })
  tie({ store: counter6$, with: storageAdapter, fail: handler })

  assert.is(watch.callCount, 1)
  assert.is(watch.calls[0].arguments.length, 1)

  const { error, ...args } = watch.calls[0].arguments[0 as any] as any
  assert.equal(args, { key: 'counter6', operation: 'get', value: undefined })
  assert.instance(error, SyntaxError)

  assert.is(mockStorage.getItem('counter6'), 'broken')
  assert.is(counter6$.getState(), 13)
})

test('should not fail if error handler is absent', () => {
  const store0$ = createStore({ test: 1 }, { name: 'store0' })
  tie({ store: store0$, with: storageAdapter })

  assert.is(mockStorage.getItem('store0'), null)

  const recursive = {}
  ;(recursive as any).recursive = recursive
  ;(store0$ as any).setState(recursive)

  assert.is(mockStorage.getItem('store0'), null)
  assert.is(store0$.getState(), recursive)
})

test('broken store value should launch `catch` handler', () => {
  const handler = createEvent<any>()
  const watch = snoop(() => undefined)
  handler.watch(watch.fn)

  const store1$ = createStore({ test: 1 }, { name: 'store1' })
  tie({ store: store1$, with: storageAdapter, fail: handler })

  assert.is(mockStorage.getItem('store1'), null)
  assert.equal(store1$.getState(), { test: 1 })

  const recursive = {}
  ;(recursive as any).recursive = recursive
  ;(store1$ as any).setState(recursive)

  assert.is(watch.callCount, 1)
  assert.is(watch.calls[0].arguments.length, 1)

  const { error, ...args } = watch.calls[0].arguments[0 as any] as any
  assert.equal(args, { key: 'store1', operation: 'set', value: recursive })
  assert.instance(error, TypeError)

  assert.is(mockStorage.getItem('store1'), null)
  assert.is(store1$.getState(), recursive)
})

test('different storage instances should not interfere', () => {
  const mockStorage1 = createStorageMock()
  const storageAdapter1 = storage(mockStorage1, false)
  const mockStorage2 = createStorageMock()
  const storageAdapter2 = storage(mockStorage2, false)

  mockStorage1.setItem('custom', '111')
  mockStorage2.setItem('custom', '222')

  const counter1$ = createStore(0)
  tie({ store: counter1$, with: storageAdapter1, key: 'custom' })

  const counter2$ = createStore(0)
  tie({ store: counter2$, with: storageAdapter2, key: 'custom' })

  assert.is(mockStorage1.getItem('custom'), '111')
  assert.is(mockStorage2.getItem('custom'), '222')
  assert.is(counter1$.getState(), 111)
  ;(counter1$ as any).setState(333)
  assert.is(mockStorage1.getItem('custom'), '333')
  assert.is(mockStorage2.getItem('custom'), '222')
  assert.is(counter1$.getState(), JSON.parse(mockStorage1.getItem('custom') as any))
  ;(counter2$ as any).setState(444)
  assert.is(mockStorage1.getItem('custom'), '333')
  assert.is(mockStorage2.getItem('custom'), '444')
  assert.is(counter2$.getState(), JSON.parse(mockStorage2.getItem('custom') as any))
})

test('broken store value should launch `sink` event', () => {
  const handler = createEvent<any>()
  const watch = snoop(() => undefined)
  handler.watch(watch.fn)
  forward({ from: sink, to: handler })

  const store2$ = createStore({})
  tie({ store: store2$, with: storageAdapter, key: 'store2' })

  const recursive = {}
  ;(recursive as any).recursive = recursive
  ;(store2$ as any).setState(recursive)

  const { error, ...args } = watch.calls[0].arguments[0 as any] as any
  assert.equal(args, { key: 'store2', operation: 'set', value: recursive })
  assert.instance(error, TypeError)
})

test('should be possible to use custom serialization', () => {
  const mockStorage = createStorageMock()
  const storageDateAdapter = storage(
    mockStorage,
    false,
    (date: Date) => String(date.getTime()),
    (timestamp: string) => new Date(Number(timestamp))
  )

  mockStorage.setItem('date', '473684400000')

  const date$ = createStore(new Date())
  tie({ store: date$, with: storageDateAdapter, key: 'date' })

  assert.is(mockStorage.getItem('date'), '473684400000')
  assert.is(date$.getState().toISOString(), '1985-01-04T11:00:00.000Z')
  ;(date$ as any).setState(new Date('1999-02-04T10:00:00.000Z'))
  assert.is(mockStorage.getItem('date'), '918122400000')
})

//
// Launch tests
//

test.run()
