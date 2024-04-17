import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore } from 'effector'
import {
  createStorage,
  createStorageFactory,
  memory,
  persist,
  async,
} from '../src'

// memory adapter with separate storage area, to prevent concurrency issues between tests
const adapter = memory({ area: new Map<string, any>() })

//
// Tests
//

test('should exports effects', () => {
  assert.type(createStorageFactory, 'function')
  assert.type(createStorageFactory(), 'function')
  assert.type(createStorage, 'function')
  const ret = createStorage('test-key', { adapter })
  assert.type(ret, 'object')
  assert.type(ret.get, 'function')
  assert.type(ret.set, 'function')
  assert.type(ret.remove, 'function')
  assert.type(ret.clear, 'function')
})

test('should be ok on good parameters', () => {
  assert.not.throws(() => {
    createStorage('test-1', {
      adapter,
    })
  })
  assert.not.throws(() => {
    createStorage({
      adapter,
      key: 'test-2',
    })
  })
  assert.not.throws(() => {
    createStorage('test-3', {
      adapter,
      keyPrefix: 'prefix-3',
    })
  })
  assert.not.throws(() => {
    createStorage({
      adapter,
      key: 'tets-4',
      keyPrefix: 'prefix-3',
    })
  })
  assert.not.throws(() => {
    createStorage('test-1', {
      adapter,
      context: createStore(0),
    })
  })
  assert.not.throws(() => {
    createStorage('test-1', {
      adapter,
      contract: (x): x is number => typeof x === 'number',
    })
  })
})

test('should handle wrong parameters', () => {
  assert.throws(
    // @ts-expect-error test wrong parameters
    () => createStorage(),
    /Adapter is not defined/
  )
  assert.throws(
    // @ts-expect-error test wrong parameters
    () => createStorage({}),
    /Adapter is not defined/
  )
  assert.throws(
    // @ts-expect-error test wrong parameters
    () => createStorage('key', {}),
    /Adapter is not defined/
  )
  assert.throws(
    // @ts-expect-error test wrong parameters
    () => createStorage({ key: 'key' }),
    /Adapter is not defined/
  )
  assert.throws(
    // @ts-expect-error test wrong parameters
    () => createStorage({ adapter }),
    /Key is not defined/
  )
})

test('should get and set value from storage', async () => {
  const watch = snoop(() => undefined)

  const { get: getFx, set: setFx } = createStorage<number>('test-get-set-1', {
    adapter,
  })

  getFx.watch(watch.fn)
  setFx.watch(watch.fn)
  getFx.finally.watch(watch.fn)
  setFx.finally.watch(watch.fn)

  assert.is(watch.callCount, 0)

  getFx()

  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[0].arguments, [undefined]) // getFx trigger
  assert.equal(watch.calls[1].arguments, [
    {
      status: 'done',
      params: undefined,
      result: undefined,
    },
  ]) // getFx result

  setFx(1)

  assert.is(watch.callCount, 4)
  assert.equal(watch.calls[2].arguments, [1]) // setFx trigger
  assert.equal(watch.calls[3].arguments, [
    {
      status: 'done',
      params: 1,
      result: undefined,
    },
  ]) // setFx result

  assert.is(await getFx(), 1)
})

test('should get and set value from storage (with adapter factory)', async () => {
  const watch = snoop(() => undefined)

  const area = new Map<string, number>()
  const { get: getFx, set: setFx } = createStorage('test-get-set-2', {
    adapter: memory,
    area,
  })

  getFx.watch(watch.fn)
  setFx.watch(watch.fn)
  getFx.finally.watch(watch.fn)
  setFx.finally.watch(watch.fn)

  assert.is(watch.callCount, 0)

  getFx()

  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[0].arguments, [undefined]) // getFx trigger
  assert.equal(watch.calls[1].arguments, [
    {
      status: 'done',
      params: undefined,
      result: undefined,
    },
  ]) // getFx result

  setFx(1)

  assert.is(watch.callCount, 4)
  assert.equal(watch.calls[2].arguments, [1]) // setFx trigger
  assert.equal(watch.calls[3].arguments, [
    {
      status: 'done',
      params: 1,
      result: undefined,
    },
  ]) // setFx result

  assert.is(await getFx(), 1)
  assert.is(area.get('test-get-set-2'), 1)
})

test('should get and set value from async storage', async () => {
  const watch = snoop(() => undefined)

  const { get: getFx, set: setFx } = createStorage('test-get-set-3', {
    adapter: async(adapter),
  })

  getFx.watch(watch.fn)
  setFx.watch(watch.fn)
  getFx.finally.watch(watch.fn)
  setFx.finally.watch(watch.fn)

  assert.is(watch.callCount, 0)

  await getFx()

  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[0].arguments, [undefined]) // getFx trigger
  assert.equal(watch.calls[1].arguments, [
    {
      status: 'done',
      params: undefined,
      result: undefined,
    },
  ]) // getFx result

  await setFx(1)

  assert.is(watch.callCount, 4)
  assert.equal(watch.calls[2].arguments, [1]) // setFx trigger
  assert.equal(watch.calls[3].arguments, [
    {
      status: 'done',
      params: 1,
      result: undefined,
    },
  ]) // setFx result

  assert.is(await getFx(), 1)
})

test('should sync effects for the same adapter-key', () => {
  const watchSet = snoop(() => undefined)
  const watchGet = snoop(() => undefined)

  const { set: setFx } = createStorage({
    adapter,
    key: 'test-sync-same-key-1',
  })
  const { get: getFx } = createStorage({
    adapter,
    key: 'test-sync-same-key-1',
  })

  getFx.watch(watchGet.fn)
  setFx.watch(watchSet.fn)
  getFx.finally.watch(watchGet.fn)
  setFx.finally.watch(watchSet.fn)

  assert.is(watchSet.callCount, 0)
  assert.is(watchGet.callCount, 0)

  setFx(1)

  assert.is(watchSet.callCount, 2)
  assert.is(watchGet.callCount, 2)
  assert.equal(watchSet.calls[0].arguments, [1]) // setFx trigger
  assert.equal(watchSet.calls[1].arguments, [
    {
      status: 'done',
      params: 1,
      result: undefined,
    },
  ]) // setFx result
  assert.equal(watchGet.calls[0].arguments, [undefined]) // getFx trigger
  assert.equal(watchGet.calls[1].arguments, [
    {
      status: 'done',
      params: undefined,
      result: 1,
    },
  ]) // getFx result
})

test('should sync with `persist` for the same adapter-key', async () => {
  const watch = snoop(() => undefined)
  const watchFx = snoop(() => undefined)

  const $store = createStore(11)
  $store.watch(watch.fn)

  assert.is($store.getState(), 11)
  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [11])

  persist({
    store: $store,
    adapter,
    key: 'test-sync-same-key-2',
  })

  assert.is($store.getState(), 11) // did not change
  assert.is(watch.callCount, 1) // did not trigger

  const { get: getFx, set: setFx } = createStorage({
    adapter,
    key: 'test-sync-same-key-2',
  })

  getFx.watch(watchFx.fn)
  setFx.watch(watchFx.fn)
  getFx.finally.watch(watchFx.fn)
  setFx.finally.watch(watchFx.fn)

  assert.is(watchFx.callCount, 0) // did not trigger

  setFx(22)

  assert.is(watchFx.callCount, 2)
  assert.equal(watchFx.calls[0].arguments, [22]) // setFx trigger
  assert.equal(watchFx.calls[1].arguments, [
    {
      status: 'done',
      params: 22,
      result: undefined,
    },
  ]) // setFx result

  assert.is($store.getState(), 22) // <- changed
  assert.is(watch.callCount, 2)
  assert.equal(watch.calls[1].arguments, [22])

  //
  ;($store as any).setState(33)

  assert.is($store.getState(), 33)
  assert.is(watch.callCount, 3)
  assert.equal(watch.calls[2].arguments, [33])

  assert.is(watchFx.callCount, 4)
  assert.equal(watchFx.calls[2].arguments, [undefined]) // getFx trigger
  assert.equal(watchFx.calls[3].arguments, [
    {
      status: 'done',
      params: undefined,
      result: 33,
    },
  ]) // getFx result

  assert.is(await getFx(), 33)
})

//
// Launch tests
//

test.run()
