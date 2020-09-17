import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore, is } from 'effector'
import { tie, StorageAdapter, StorageStore } from '../src'

//
// Dumb fake adapter
//

const dumbAdapter: StorageAdapter = <T>(init: T) => ({
  get: () => init,
  set: (value: T) => value,
})

const nullAdapter: StorageAdapter = () => ({
  get: () => null as any,
  set: () => undefined,
})

const testAdapter: StorageAdapter<{ test: number }> = <T>(init: T) => ({
  get: () => init,
  set: (value: T) => value,
})

//
// Tests
//

test('should exports function', () => {
  assert.type(tie, 'function')
})

test('should be curried', () => {
  assert.type(tie(createStore(0)), 'function')
  assert.type(tie({ with: dumbAdapter }), 'function')
  assert.type(tie({ with: testAdapter }), 'function')
  assert.type(tie({ with: dumbAdapter, key: 'test' }), 'function')
  assert.type(tie({ with: dumbAdapter })({ key: 'test' }), 'function')
  assert.type(tie({ with: testAdapter, key: 'test' }), 'function')
  assert.type(tie({ with: testAdapter })({ key: 'test' }), 'function')
  assert.type(tie(createStore(0))({ with: dumbAdapter }), 'function')
  assert.type(tie(createStore(0))({ with: testAdapter }), 'function')
  assert.type(tie(createStore(0))({ with: dumbAdapter, x: 1 }), 'function')
  assert.type(tie({ with: dumbAdapter })(createStore(0)), 'function')
  assert.type(tie({ with: testAdapter })(createStore(0)), 'function')
  assert.type(tie({}), 'function')
  assert.type(tie({})(createStore(0)), 'function')
  assert.type(
    tie({ with: dumbAdapter })({ key: 'test' })({ with: testAdapter }),
    'function'
  )

  // I decided to drop support of this feature in favor of library size
  assert.not.type(tie(createStore(0))({ with: testAdapter, key: 'test' }), 'function')
  assert.not.type(tie(createStore(0))({ with: testAdapter })({ key: 'test' }), 'function')
  assert.not.type(
    tie({ with: testAdapter, store: createStore(0), key: 'test' }),
    'function'
  )
})

test('should handle wrong arguments', () => {
  assert.throws(() => tie(createStore), /Storage adapter is not defined/)
  assert.throws(() => tie({})(createStore), /Storage adapter is not defined/)
  assert.throws(() => tie({ key: 'test' })(createStore), /Storage adapter is not defined/)
})

test('should create tied store creator', () => {
  const createDumbStore = tie({ with: dumbAdapter })(createStore)
  const createTestStore1 = tie({ with: testAdapter })(createStore)
  const createTestStore2 = tie({ with: testAdapter, test: 0 })(createStore)

  assert.type(createDumbStore, 'function')
  assert.type(createTestStore1, 'function')
  assert.type(createTestStore2, 'function')

  const store1 = createDumbStore(0, { key: 'test' })
  const store2 = createTestStore1(0, { key: 'test', test: 0 })
  const store3 = createTestStore2(0, { key: 'test' })

  assert.type(store1, 'object')
  assert.type(store2, 'object')
  assert.type(store3, 'object')
  assert.ok(is.store(store1))
  assert.ok(is.store(store2))
  assert.ok(is.store(store3))
})

test('should tie store', () => {
  // const cfg = { with: dumbAdapter }
  let store

  store = tie(createStore(0))({ with: dumbAdapter, key: 'test' })
  assert.type(store, 'object')
  assert.ok(is.store(store))

  store = tie({ with: dumbAdapter, key: 'test' })(createStore(0))
  assert.type(store, 'object')
  assert.ok(is.store(store))

  store = tie({ with: dumbAdapter })({ key: 'test' })(createStore(0))
  assert.type(store, 'object')
  assert.ok(is.store(store))

  store = tie({ key: 'test' })({ with: dumbAdapter })(createStore(0))
  assert.type(store, 'object')
  assert.ok(is.store(store))

  store = tie(createStore(0))({ with: testAdapter, key: 'test', test: 0 })
  assert.type(store, 'object')
  assert.ok(is.store(store))

  store = tie({ with: testAdapter, key: 'test', test: 0 })(createStore(0))
  assert.type(store, 'object')
  assert.ok(is.store(store))

  store = tie({ with: testAdapter })({ key: 'test', test: 0 })(createStore(0))
  assert.type(store, 'object')
  assert.ok(is.store(store))

  store = tie({ key: 'test', test: 0 })({ with: testAdapter })(createStore(0))
  assert.type(store, 'object')
  assert.ok(is.store(store))
})

test('should tie and return the same store', () => {
  const store$ = createStore(0)
  const tied$ = tie({ store: store$, with: dumbAdapter, key: 'test' })
  assert.is(tied$, store$)
})

test('should add .catch(..) to tied store', () => {
  const store$ = createStore(0)
  const tied$ = tie({ store: store$, with: dumbAdapter, key: 'test' })
  assert.type(tied$.catch, 'function')
  assert.ok(tied$.catch === (store$ as any).catch)
  assert.ok(tied$.catch(() => undefined) === tied$)
  assert.ok(tied$.catch(() => undefined) === store$)

  const newtied$ = tie({ with: dumbAdapter })(createStore)(0, { key: 'test' })
  assert.type(newtied$.catch, 'function')
  assert.ok(newtied$.catch(() => undefined) === newtied$)
})

test('curried tie should create different store creators', () => {
  const withDumbAdapter = tie({ with: dumbAdapter })
  const withNullAdapter = tie({ with: nullAdapter })

  const createDumbStore = withDumbAdapter(createStore)
  const createNullStore = withNullAdapter(createStore)

  const dumb$ = createDumbStore(0, { key: 'test' })
  const null$ = createNullStore(0, { key: 'test' })

  assert.is(dumb$.getState(), 0)
  assert.is(null$.getState(), null)
})

test('should restore value from adapter on existing store', () => {
  const watch = snoop(() => undefined)

  const store$ = createStore(0)
  store$.watch(watch.fn)

  assert.is(store$.getState(), 0)
  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [0])

  store$.thru<StorageStore<number>>(tie({ with: nullAdapter, key: 'test' }))

  assert.is(store$.getState(), null)
  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[1].arguments, [null])
})

test.run()
