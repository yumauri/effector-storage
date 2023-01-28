import type { StorageAdapter } from '../src/types'
import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { createStorageMock } from './mocks/storage.mock'
import { local } from '../src/local'
import { nil } from '../src/nil'
import { either } from '../src/tools'

declare let global: any

//
// Dumb fake adapter
//

const dumbAdapter: StorageAdapter = <T>() => {
  let __: T = 0 as any
  return {
    get: (): T => __,
    set: (value: T) => (__ = value),
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

//
// Launch tests
//

test.run()
