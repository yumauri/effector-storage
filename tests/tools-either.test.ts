import type { StorageAdapter } from '../src/types'
import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { persist, local, nil, log, either } from '../src'

declare let global: any

//
// Dumb fake adapter
//

const dumbAdapter: StorageAdapter = <T>() => {
  let __: T = 0 as any
  return {
    get: (): T => __,
    set: (value: T) => void (__ = value),
  }
}

//
// Tests
//

test('should return first adapter if first one is not noop', () => {
  const one = dumbAdapter
  const another = nil()
  assert.equal(either(one, another), one)
})

test('should return second adapter if first one is noop', () => {
  const one = nil()
  const another = dumbAdapter
  assert.equal(either(one, another), another)
})

test('should return localStorage adapter if localStorage is supported', () => {
  try {
    global.localStorage = createStorageMock()
    const one = local()
    const another = dumbAdapter
    assert.equal(either(one, another), one)
  } finally {
    delete global.localStorage
  }
})

test('should return second adapter if localStorage is not supported', () => {
  const one = local()
  const another = dumbAdapter
  assert.equal(either(one, another), another)
})

test('should work with factories', () => {
  const logger = snoop(() => undefined)

  const $counter1 = createStore(1, { name: 'counter1' })

  persist({
    adapter: either(local, log),
    store: $counter1,
    logger: logger.fn,
  })

  assert.is(logger.callCount, 1)
  assert.equal(logger.calls[0].arguments, [
    '[log adapter] get value for key "counter1"',
  ])
})

//
// Launch tests
//

test.run()
