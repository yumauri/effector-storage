import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore, createDomain } from 'effector'
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

test('should call watcher twice', () => {
  const watch = snoop(() => undefined)

  const $store = createStore(1)
  $store.watch(watch.fn)

  persist({ store: $store, with: dumbAdapter, key: 'domain::store0' })

  assert.is($store.getState(), 0)
  assert.is($store.defaultState, 1)

  // call watcher twice
  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[0].arguments, [1])
  assert.equal(watch.calls[1].arguments, [0])
})

test('should call watcher once if persisted in domain hook', () => {
  const watch = snoop(() => undefined)
  const root = createDomain()

  root.onCreateStore((store) => {
    persist({ store, with: dumbAdapter })
  })

  const $store = root.createStore(1, { name: 'domain::store1' })
  $store.watch(watch.fn)

  assert.is($store.getState(), 0)
  assert.is($store.defaultState, 1)

  // call watcher once
  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [0])
})

test('should throw error in case of missing name in named domain', async () => {
  const root = createDomain('root')

  let rs: any, rj: any
  const defer = new Promise((resolve, reject) => {
    rs = resolve
    rj = reject
  })

  root.onCreateStore((store) => {
    try {
      persist({ store, with: dumbAdapter })
      rs()
    } catch (err) {
      rj(err)
    }
  })

  root.createStore(1)

  try {
    await defer
    assert.unreachable()
  } catch (err) {
    assert.instance(err, Error)
    assert.match(err, /Key or name is not defined/)
  }
})

//
// Launch tests
//

test.run()
