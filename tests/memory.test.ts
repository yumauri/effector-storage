import { test, mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { createStore } from 'effector'
import { memory, persist, createStorage } from '../src/memory'
import { memory as memoryIndex } from '../src'

//
// Tests
//

test('should export adapter and `persist` function', () => {
  assert.ok(typeof memory === 'function')
  assert.ok(typeof persist === 'function')
  assert.ok(typeof createStorage === 'function')
})

test('should be exported from package root', () => {
  assert.strictEqual(memory, memoryIndex)
})

test('should be ok on good parameters', () => {
  const $store = createStore(0, { name: 'memory::store' })
  assert.doesNotThrow(() => persist({ store: $store }))
  assert.doesNotThrow(() => createStorage('memory::store'))
  assert.doesNotThrow(() => createStorage({ key: 'memory::store' }))
})

test('should sync stores, persisted with memory adapter', () => {
  const watch = mock.fn()

  const $store0 = createStore(1)
  const $store1 = createStore(2)
  $store0.watch(watch)
  $store1.watch(watch)

  assert.strictEqual($store0.getState(), 1)
  assert.strictEqual($store1.getState(), 2)
  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[0].arguments, [1])
  assert.deepEqual(watch.mock.calls[1].arguments, [2])

  persist({ store: $store0, key: 'same-key-1' })
  persist({ store: $store1, key: 'same-key-1' })

  assert.strictEqual($store0.getState(), 1)
  assert.strictEqual($store1.getState(), 2)
  assert.strictEqual(watch.mock.callCount(), 2)

  //
  ;($store0 as any).setState(3)

  assert.strictEqual($store0.getState(), 3)
  assert.strictEqual($store1.getState(), 3) // <- also changes
  assert.strictEqual(watch.mock.callCount(), 4)
  assert.deepEqual(watch.mock.calls[2].arguments, [3])
  assert.deepEqual(watch.mock.calls[3].arguments, [3])
})
