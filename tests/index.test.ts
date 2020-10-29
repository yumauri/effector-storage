import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createEvent, createStore } from 'effector'
import { tie, StorageAdapter } from '../src'

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

test('should exports function', () => {
  assert.type(tie, 'function')
})

test('should be ok on good parameters', () => {
  const store0$ = createStore(0)
  const store1$ = createStore(0)
  assert.not.throws(() => tie({ with: dumbAdapter, store: store0$ }))
  assert.not.throws(() => tie({ with: dumbAdapter, source: store1$, target: store1$ }))
})

test('should handle wrong parameters', () => {
  const event = createEvent<number>()
  assert.throws(() => tie({} as any), /Adapter is not defined/)
  assert.throws(() => tie({ with: dumbAdapter } as any), /Store or source is not defined/)
  assert.throws(() => tie({ with: dumbAdapter, source: event } as any), /Target is not defined/)
  assert.throws(
    () => tie({ with: dumbAdapter, target: event } as any),
    /Store or source is not defined/
  )
  assert.throws(
    () => tie({ with: dumbAdapter, source: event, target: event }),
    /Source must be different from target/
  )
})

test('should return Subscription', () => {
  const store$ = createStore(0)
  const untie = tie({ store: store$, with: dumbAdapter, key: 'test' })
  assert.type(untie, 'function')
  assert.type(untie.unsubscribe, 'function')
})

test('should restore value from adapter on store', () => {
  const watch = snoop(() => undefined)

  const store$ = createStore(1)
  store$.watch(watch.fn)

  assert.is(store$.getState(), 1)
  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [1])

  tie({ store: store$, with: dumbAdapter, key: 'test' })

  assert.is(store$.getState(), 0)
  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[1].arguments, [0])
})

test('should sync stores, tied to the same adapter-key', () => {
  const watch = snoop(() => undefined)

  const store0$ = createStore(1)
  const store1$ = createStore(2)
  store0$.watch(watch.fn)
  store1$.watch(watch.fn)

  assert.is(store0$.getState(), 1)
  assert.is(store1$.getState(), 2)
  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[0].arguments, [1])
  assert.equal(watch.calls[1].arguments, [2])

  tie({ store: store0$, with: dumbAdapter, key: 'same-key-1' })
  tie({ store: store1$, with: dumbAdapter, key: 'same-key-1' })

  assert.is(store0$.getState(), 0)
  assert.is(store1$.getState(), 0)
  assert.is(watch.callCount, 4)
  assert.equal(watch.calls[2].arguments, [0])
  assert.equal(watch.calls[3].arguments, [0])

  //
  ;(store0$ as any).setState(3)

  assert.is(store0$.getState(), 3)
  assert.is(store1$.getState(), 3) // <- also changes
  assert.is(watch.callCount, 6)
  assert.equal(watch.calls[4].arguments, [3])
  assert.equal(watch.calls[5].arguments, [3])
})

test('should untie stores', () => {
  const watch = snoop(() => undefined)

  const store0$ = createStore(1)
  const store1$ = createStore(2)
  store0$.watch(watch.fn)
  store1$.watch(watch.fn)

  assert.is(store0$.getState(), 1)
  assert.is(store1$.getState(), 2)
  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[0].arguments, [1])
  assert.equal(watch.calls[1].arguments, [2])

  tie({ store: store0$, with: dumbAdapter, key: 'same-key-2' })
  const untie = tie({ store: store1$, with: dumbAdapter, key: 'same-key-2' })

  assert.is(store0$.getState(), 0)
  assert.is(store1$.getState(), 0)
  assert.is(watch.callCount, 4)
  assert.equal(watch.calls[2].arguments, [0])
  assert.equal(watch.calls[3].arguments, [0])

  untie()

  //
  ;(store0$ as any).setState(3)

  assert.is(store0$.getState(), 3)
  assert.is(store1$.getState(), 0) // <- same as before
  assert.is(watch.callCount, 5)
  assert.equal(watch.calls[4].arguments, [3])
})

//
// Launch tests
//

test.run()
