import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { createStore, is } from 'effector'
import { persist } from '../src/memory/fp'

//
// Tests
//

test('should export adapter and `persist` function', () => {
  assert.type(persist, 'function')
})

test('should be ok on good parameters', () => {
  const $store = createStore(0, { name: 'memory-fp::store' })
  assert.not.throws(() => persist()($store))
})

test('should return Store', () => {
  const $store0 = createStore(0)
  const $store1 = persist({ key: 'memory-fp::store0' })($store0)
  assert.ok(is.store($store1))
  assert.ok($store1 === $store0)
})

//
// Launch tests
//

test.run()
