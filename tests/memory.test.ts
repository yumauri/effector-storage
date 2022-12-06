import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore } from 'effector'
import { memory, persist } from '../src/memory'

//
// Tests
//

test('should export adapter and `persist` function', () => {
  assert.type(memory, 'function')
  assert.type(persist, 'function')
})

test('should be ok on good parameters', () => {
  const $store = createStore(0, { name: 'memory::store' })
  assert.not.throws(() => persist({ store: $store }))
})

test('should sync stores, persisted with memory adapter', () => {
  const watch = snoop(() => undefined)

  const $store0 = createStore(1)
  const $store1 = createStore(2)
  $store0.watch(watch.fn)
  $store1.watch(watch.fn)

  assert.is($store0.getState(), 1)
  assert.is($store1.getState(), 2)
  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[0].arguments, [1])
  assert.equal(watch.calls[1].arguments, [2])

  persist({ store: $store0, key: 'same-key-1' })
  persist({ store: $store1, key: 'same-key-1' })

  assert.is($store0.getState(), 1)
  assert.is($store1.getState(), 2)
  assert.is(watch.callCount, 2)

  //
  ;($store0 as any).setState(3)

  assert.is($store0.getState(), 3)
  assert.is($store1.getState(), 3) // <- also changes
  assert.is(watch.callCount, 4)
  assert.equal(watch.calls[2].arguments, [3])
  assert.equal(watch.calls[3].arguments, [3])
})

//
// Launch tests
//

test.run()
