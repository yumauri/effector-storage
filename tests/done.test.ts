import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createEvent, createStore } from 'effector'
import { persist, StorageAdapter } from '../src'

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

test('should fire done and finally events', () => {
  const watch = snoop(() => undefined)

  const done = createEvent<any>()
  const anyway = createEvent<any>()
  done.watch(watch.fn)
  anyway.watch(watch.fn)

  const $store = createStore(1)
  persist({
    store: $store,
    adapter: dumbAdapter,
    key: 'test',
    done,
    finally: anyway,
  })

  assert.is(watch.callCount, 2)

  // `finally`, get value from storage
  assert.equal(watch.calls[0].arguments, [
    {
      key: 'test',
      operation: 'get',
      status: 'done',
      value: 0,
    },
  ])

  // `done`, get value from storage
  assert.equal(watch.calls[1].arguments, [
    {
      key: 'test',
      operation: 'get',
      value: 0,
    },
  ])
})

//
// Launch tests
//

test.run()
