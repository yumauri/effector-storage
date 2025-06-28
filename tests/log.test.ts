import { test, mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { createStore } from 'effector'
import { persist, log } from '../src'
import { log as logNested } from '../src/log'

//
// Tests
//

test('should be exported from package root', () => {
  assert.strictEqual(log, logNested)
})

test('store should ignore initial `undefined` from storage value', () => {
  const logger = mock.fn()

  const $counter0 = createStore(42, { name: 'log::counter0' })

  persist({ store: $counter0, adapter: log({ logger }) })

  assert.strictEqual($counter0.getState(), 42)
  assert.strictEqual(logger.mock.callCount(), 1)
  assert.deepEqual(logger.mock.calls[0].arguments, [
    '[log adapter] get value for key "log::counter0"',
  ])
})

test('store new value should be ignored by storage', () => {
  const logger = mock.fn()

  const $counter1 = createStore(0, { name: 'log::counter1' })

  persist({ store: $counter1, adapter: log({ logger }) })
  ;($counter1 as any).setState(42)

  assert.strictEqual($counter1.getState(), 42)
  assert.strictEqual(logger.mock.callCount(), 2)
  assert.deepEqual(logger.mock.calls[1].arguments, [
    '[log adapter] set value "42" with key "log::counter1"',
  ])
})

test('stores in with different key area should not be synced', () => {
  const logger = mock.fn()

  const $store1 = createStore(0)
  const $store2 = createStore(0)

  persist({
    store: $store1,
    key: 'store',
    adapter: log,
    keyArea: 'area1',
    logger,
  })

  persist({
    store: $store2,
    key: 'store',
    adapter: log,
    keyArea: 'area2',
    logger,
  })

  // update one of two stores
  ;($store1 as any).setState(42)

  assert.strictEqual($store1.getState(), 42)
  assert.strictEqual($store2.getState(), 0) // <- should not change
})

test('should use console.log by default', () => {
  const logger = mock.fn()

  const $counter3 = createStore(42, { name: 'log::counter3' })

  const consoleLog = console.log
  console.log = logger // mock default console.log
  try {
    persist({ store: $counter3, adapter: log() })
  } finally {
    console.log = consoleLog // restore default console.log
  }

  assert.strictEqual(logger.mock.callCount(), 1)
  assert.deepEqual(logger.mock.calls[0].arguments, [
    '[log adapter] get value for key "log::counter3"',
  ])
})
