import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore, createDomain } from 'effector'
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

test('should call watcher twice', () => {
  const watch = snoop(() => undefined)

  const store$ = createStore(1)
  store$.watch(watch.fn)

  tie({ store: store$, with: dumbAdapter })

  assert.is(store$.getState(), 0)
  assert.is(store$.defaultState, 1)

  // call watcher twice
  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[0].arguments, [1])
  assert.equal(watch.calls[1].arguments, [0])
})

test('should call watcher once if tied in domain hook', () => {
  const watch = snoop(() => undefined)
  const root = createDomain()

  root.onCreateStore((store) => {
    tie({ store, with: dumbAdapter })
  })

  const store$ = root.createStore(1)
  store$.watch(watch.fn)

  assert.is(store$.getState(), 0)
  assert.is(store$.defaultState, 1)

  // call watcher once
  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [0])
})

//
// Launch tests
//

test.run()
