import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore } from 'effector'
import { persist, log } from '../src'

//
// Tests
//

test('store should ignore initial `undefined` from storage value', () => {
  const logger = snoop(() => undefined)

  const $counter0 = createStore(42, { name: 'log::counter0' })

  persist({ store: $counter0, adapter: log({ logger: logger.fn }) })

  assert.is($counter0.getState(), 42)
  assert.is(logger.callCount, 1)
  assert.equal(logger.calls[0].arguments, [
    '[log adapter] get value for key "log::counter0"',
  ])
})

test('store new value should be ignored by storage', () => {
  const logger = snoop(() => undefined)

  const $counter1 = createStore(0, { name: 'log::counter1' })

  persist({ store: $counter1, adapter: log({ logger: logger.fn }) })
  ;($counter1 as any).setState(42)

  assert.is($counter1.getState(), 42)
  assert.is(logger.callCount, 2)
  assert.equal(logger.calls[1].arguments, [
    '[log adapter] set value "42" with key "log::counter1"',
  ])
})

test('stores in with different key area should not be synced', () => {
  const logger = snoop(() => undefined)

  const $store1 = createStore(0)
  const $store2 = createStore(0)

  persist({
    store: $store1,
    key: 'store',
    adapter: log,
    keyArea: 'area1',
    logger: logger.fn,
  })

  persist({
    store: $store2,
    key: 'store',
    adapter: log,
    keyArea: 'area2',
    logger: logger.fn,
  })

  // update one of two stores
  ;($store1 as any).setState(42)

  assert.is($store1.getState(), 42)
  assert.is($store2.getState(), 0) // <- should not change
})

test('should use console.log by default', () => {
  const logger = snoop(() => undefined)

  const $counter3 = createStore(42, { name: 'log::counter3' })

  const consoleLog = console.log
  console.log = logger.fn // mock default console.log
  try {
    persist({ store: $counter3, adapter: log() })
  } finally {
    console.log = consoleLog // restore default console.log
  }

  assert.is(logger.callCount, 1)
  assert.equal(logger.calls[0].arguments, [
    '[log adapter] get value for key "log::counter3"',
  ])
})

//
// Launch tests
//

test.run()
