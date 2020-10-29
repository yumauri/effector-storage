import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createEvent, createStore, forward } from 'effector'
import { tie, StorageAdapter, sink } from '../src'

//
// Error fake adapters
//

const syncErrorAdapter: StorageAdapter = () => ({
  get: (): never => {
    throw 'get' // eslint-disable-line no-throw-literal
  },
  set: (): never => {
    throw 'set' // eslint-disable-line no-throw-literal
  },
})

const asyncErrorAdapter: StorageAdapter = (_, update) => {
  setTimeout(update, 10)
  return {
    get: () => Promise.reject('get'), // eslint-disable-line prefer-promise-reject-errors
    set: () => Promise.reject('set'), // eslint-disable-line prefer-promise-reject-errors
  }
}

//
// Tests
//

test('should fire error handler on sync errors', () => {
  const watch = snoop(() => undefined)

  const error = createEvent<any>()
  error.watch(watch.fn)

  const store$ = createStore(0)
  tie({ store: store$, with: syncErrorAdapter, key: 'key-1', fail: error })

  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [
    { key: 'key-1', operation: 'get', error: 'get', value: undefined },
  ])

  //
  ;(store$ as any).setState(1)
  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[1].arguments, [
    { key: 'key-1', operation: 'set', error: 'set', value: 1 },
  ])
})

test('should fire error handler on async errors', async () => {
  const watch = snoop(() => undefined)

  const error = createEvent<any>()
  error.watch(watch.fn)

  const store$ = createStore(0)
  tie({ store: store$, with: asyncErrorAdapter, key: 'key-2', fail: error })
  assert.is(watch.callCount, 0)

  await Promise.resolve()
  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [
    { key: 'key-2', operation: 'get', error: 'get', value: undefined },
  ])

  //
  ;(store$ as any).setState(1)
  assert.is(watch.callCount, 1)

  await Promise.resolve()

  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[1].arguments, [
    { key: 'key-2', operation: 'set', error: 'set', value: 1 },
  ])

  await new Promise((resolve) => setTimeout(resolve, 20))
  assert.is(watch.callCount, 3)
  assert.equal(watch.calls[2].arguments, [
    { key: 'key-2', operation: 'get', error: 'get', value: undefined },
  ])
})

test('should not fire error handler on untied store', async () => {
  const watch = snoop(() => undefined)

  const error = createEvent<any>()
  error.watch(watch.fn)

  const store$ = createStore(0)
  const untie = tie({ store: store$, with: asyncErrorAdapter, key: 'key-3', fail: error })
  assert.is(watch.callCount, 0)

  untie()

  await new Promise((resolve) => setTimeout(resolve, 20))
  assert.is(watch.callCount, 0) // <- still zero
})

test('should use `sink` for unhandled error', () => {
  const watch = snoop(() => undefined)

  const error = createEvent<any>()
  error.watch(watch.fn)
  forward({ from: sink, to: error })

  const store$ = createStore(0)
  tie({ store: store$, with: syncErrorAdapter, key: 'key-1' })

  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [
    { key: 'key-1', operation: 'get', error: 'get', value: undefined },
  ])

  //
  ;(store$ as any).setState(1)
  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[1].arguments, [
    { key: 'key-1', operation: 'set', error: 'set', value: 1 },
  ])
})

//
// Launch tests
//

test.run()
