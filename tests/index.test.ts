import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore, createEvent, is } from 'effector'
import { tie, StorageAdapter } from '../src'

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

const cfg = { with: dumbAdapter }

//
// Tests
//

test('should exports function', () => {
  assert.type(tie, 'function')
})

test('should be curried', () => {
  assert.type(tie(createStore), 'function')
  assert.type(tie(cfg), 'function')
  assert.type(tie({ ...cfg, key: 'test' }), 'function')
  assert.type(tie(createStore(0)), 'function')
})

test('should handle wrong arguments', () => {
  const cfgEx = { ...cfg, key: 'test' }
  assert.throws(() => tie(createStore)(createStore as any), /Config is not defined/)
  assert.throws(() => tie(createStore(0))(createStore(0) as any), /Config is not defined/)
  assert.throws(() => tie(cfg)(cfg as any), /Store creator or store is not defined/)
  assert.throws(() => tie(cfg)(cfgEx as any), /Store creator or store is not defined/)
  assert.throws(() => tie(cfgEx)(cfgEx as any), /Store creator or store is not defined/)
  assert.throws(() => tie(cfgEx)(cfg as any), /Store creator or store is not defined/)
})

test('should create tied store creator', () => {
  assert.type(tie(createStore)(cfg), 'function')
  assert.type(tie(createStore)(cfg, createEvent), 'function')
  assert.type(tie(createStore)(cfg, createEvent()), 'function')
  assert.type(tie(createStore, cfg), 'function')
  assert.type(tie(createStore, cfg, createEvent), 'function')
  assert.type(tie(createStore, cfg, createEvent()), 'function')
  assert.type(tie(cfg)(createStore), 'function')
  assert.type(tie(cfg)(createStore, createEvent), 'function')
  assert.type(tie(cfg)(createStore, createEvent()), 'function')
  assert.type(tie(cfg, createStore), 'function')
  assert.type(tie(cfg, createStore, createEvent), 'function')
  assert.type(tie(cfg, createStore, createEvent()), 'function')
  assert.type(tie(createStore)(cfg)(0, { key: 'test' }), 'object')
  assert.type(tie(createStore)(cfg, createEvent)(0, { key: 'test' }), 'object')
  assert.type(tie(createStore)(cfg, createEvent())(0, { key: 'test' }), 'object')
  assert.type(tie(createStore, cfg)(0, { key: 'test' }), 'object')
  assert.type(tie(createStore, cfg, createEvent)(0, { key: 'test' }), 'object')
  assert.type(tie(createStore, cfg, createEvent())(0, { key: 'test' }), 'object')
  assert.type(tie(cfg)(createStore)(0, { key: 'test' }), 'object')
  assert.type(tie(cfg)(createStore, createEvent)(0, { key: 'test' }), 'object')
  assert.type(tie(cfg)(createStore, createEvent())(0, { key: 'test' }), 'object')
  assert.type(tie(cfg, createStore)(0, { key: 'test' }), 'object')
  assert.type(tie(cfg, createStore, createEvent)(0, { key: 'test' }), 'object')
  assert.type(tie(cfg, createStore, createEvent())(0, { key: 'test' }), 'object')
  assert.ok(is.store(tie(createStore)(cfg)(0, { key: 'test' })))
  assert.ok(is.store(tie(createStore)(cfg, createEvent)(0, { key: 'test' })))
  assert.ok(is.store(tie(createStore)(cfg, createEvent())(0, { key: 'test' })))
  assert.ok(is.store(tie(createStore, cfg)(0, { key: 'test' })))
  assert.ok(is.store(tie(createStore, cfg, createEvent)(0, { key: 'test' })))
  assert.ok(is.store(tie(createStore, cfg, createEvent())(0, { key: 'test' })))
  assert.ok(is.store(tie(cfg)(createStore)(0, { key: 'test' })))
  assert.ok(is.store(tie(cfg)(createStore, createEvent)(0, { key: 'test' })))
  assert.ok(is.store(tie(cfg)(createStore, createEvent())(0, { key: 'test' })))
  assert.ok(is.store(tie(cfg, createStore)(0, { key: 'test' })))
  assert.ok(is.store(tie(cfg, createStore, createEvent)(0, { key: 'test' })))
  assert.ok(is.store(tie(cfg, createStore, createEvent())(0, { key: 'test' })))
})

test('should tie store', () => {
  const cfgEx = { ...cfg, key: 'test' }
  assert.type(tie(createStore(0))(cfgEx), 'object')
  assert.type(tie(createStore(0))(cfgEx, createEvent), 'object')
  assert.type(tie(createStore(0))(cfgEx, createEvent<number | undefined>()), 'object')
  assert.type(tie(createStore(0), cfgEx), 'object')
  assert.type(tie(createStore(0), cfgEx, createEvent), 'object')
  assert.type(tie(createStore(0), cfgEx, createEvent<number | undefined>()), 'object')
  assert.type(tie(cfgEx)(createStore(0)), 'object')
  assert.type(tie(cfgEx)(createStore(0), createEvent), 'object')
  assert.type(tie(cfgEx)(createStore(0), createEvent<number | undefined>()), 'object')
  assert.type(tie(cfgEx, createStore(0)), 'object')
  assert.type(tie(cfgEx, createStore(0), createEvent), 'object')
  assert.type(tie(cfgEx, createStore(0), createEvent<number | undefined>()), 'object')
  assert.ok(is.store(tie(createStore(0))(cfgEx)))
  assert.ok(is.store(tie(createStore(0))(cfgEx, createEvent)))
  assert.ok(is.store(tie(createStore(0))(cfgEx, createEvent<number | undefined>())))
  assert.ok(is.store(tie(createStore(0), cfgEx)))
  assert.ok(is.store(tie(createStore(0), cfgEx, createEvent)))
  assert.ok(is.store(tie(createStore(0), cfgEx, createEvent<number | undefined>())))
  assert.ok(is.store(tie(cfgEx)(createStore(0))))
  assert.ok(is.store(tie(cfgEx)(createStore(0), createEvent)))
  assert.ok(is.store(tie(cfgEx)(createStore(0), createEvent<number | undefined>())))
  assert.ok(is.store(tie(cfgEx, createStore(0))))
  assert.ok(is.store(tie(cfgEx, createStore(0), createEvent)))
  assert.ok(is.store(tie(cfgEx, createStore(0), createEvent<number | undefined>())))
})

test('should tie and return the same store', () => {
  const store$ = createStore(0)
  const tied$ = tie(store$, { with: dumbAdapter, key: 'test' })
  assert.is(tied$, store$)
})

test('should add .catch(..) to tied store', () => {
  const store$ = createStore(0)
  const tied$ = tie(store$, { with: dumbAdapter, key: 'test' })
  assert.type(tied$.catch, 'function')
  assert.ok(tied$.catch === (store$ as any).catch)
  assert.ok(tied$.catch(() => undefined) === tied$)
  assert.ok(tied$.catch(() => undefined) === store$)

  const newtied$ = tie(createStore, cfg)(0, { key: 'test' })
  assert.type(newtied$.catch, 'function')
  assert.ok(newtied$.catch(() => undefined) === newtied$)
})

test('curried tie should create different store creators', () => {
  const createStorageStoreCreator = tie(createStore)

  const createDumbStore = createStorageStoreCreator({ with: dumbAdapter })
  const createNullStore = createStorageStoreCreator({ with: nullAdapter })

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

  tie(store$, { with: nullAdapter, key: 'test', using: createEvent })

  assert.is(store$.getState(), null)
  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[1].arguments, [null])
})

test.run()
