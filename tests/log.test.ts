import { createStore } from 'effector'
import { expect, it, vi } from 'vitest'
import { log, persist } from '../src'
import { log as logNested } from '../src/log'

//
// Tests
//

it('should be exported from package root', () => {
  expect(log).toBe(logNested)
})

it('store should ignore initial `undefined` from storage value', () => {
  const logger = vi.fn()

  const $counter0 = createStore(42, { name: 'log::counter0' })

  persist({ store: $counter0, adapter: log({ logger }) })

  expect($counter0.getState()).toBe(42)
  expect(logger).toHaveBeenCalledTimes(1)
  expect(logger.mock.calls[0]).toEqual([
    '[log adapter] get value for key "log::counter0"',
  ])
})

it('store new value should be ignored by storage', () => {
  const logger = vi.fn()

  const $counter1 = createStore(0, { name: 'log::counter1' })

  persist({ store: $counter1, adapter: log({ logger }) })
  ;($counter1 as any).setState(42)

  expect($counter1.getState()).toBe(42)
  expect(logger).toHaveBeenCalledTimes(2)
  expect(logger.mock.calls[1]).toEqual([
    '[log adapter] set value "42" with key "log::counter1"',
  ])
})

it('stores in with different key area should not be synced', () => {
  const logger = vi.fn()

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

  expect($store1.getState()).toBe(42)
  expect($store2.getState()).toBe(0) // <- should not change
})

it('should use console.log by default', () => {
  const logger = vi.fn()

  const $counter3 = createStore(42, { name: 'log::counter3' })

  const consoleLog = console.log
  console.log = logger // mock default console.log
  try {
    persist({ store: $counter3, adapter: log() })
  } finally {
    console.log = consoleLog // restore default console.log
  }

  expect(logger).toHaveBeenCalledTimes(1)
  expect(logger.mock.calls[0]).toEqual([
    '[log adapter] get value for key "log::counter3"',
  ])
})
