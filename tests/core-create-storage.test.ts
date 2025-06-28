import { test, mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { createStore, createEvent } from 'effector'
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
  assert.ok(typeof createStorageFactory === 'function')
  assert.ok(typeof createStorageFactory() === 'function')
  assert.ok(typeof createStorage === 'function')
  const ret = createStorage('test-key', { adapter })
  assert.ok(typeof ret === 'object')
  assert.ok(typeof ret.getFx === 'function')
  assert.ok(typeof ret.setFx === 'function')
  assert.ok(typeof ret.removeFx === 'function')
})

test('should be ok on good parameters', () => {
  assert.doesNotThrow(() => {
    createStorage('test-1', {
      adapter,
    })
  })
  assert.doesNotThrow(() => {
    createStorage({
      adapter,
      key: 'test-2',
    })
  })
  assert.doesNotThrow(() => {
    createStorage('test-3', {
      adapter,
      keyPrefix: 'prefix-3',
    })
  })
  assert.doesNotThrow(() => {
    createStorage({
      adapter,
      key: 'tets-4',
      keyPrefix: 'prefix-3',
    })
  })
  assert.doesNotThrow(() => {
    createStorage('test-1', {
      adapter,
      context: createStore(0),
    })
  })
  assert.doesNotThrow(() => {
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
  const watch = mock.fn()

  const { getFx, setFx } = createStorage<number>('test-get-set-1', {
    adapter,
  })

  getFx.watch(watch)
  setFx.watch(watch)
  getFx.finally.watch(watch)
  setFx.finally.watch(watch)

  assert.strictEqual(watch.mock.callCount(), 0)

  getFx()

  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[0].arguments, [undefined]) // getFx trigger
  assert.deepEqual(watch.mock.calls[1].arguments, [
    {
      status: 'done',
      params: undefined,
      result: undefined,
    },
  ]) // getFx result

  setFx(1)

  assert.strictEqual(watch.mock.callCount(), 4)
  assert.deepEqual(watch.mock.calls[2].arguments, [1]) // setFx trigger
  assert.deepEqual(watch.mock.calls[3].arguments, [
    {
      status: 'done',
      params: 1,
      result: undefined,
    },
  ]) // setFx result

  assert.strictEqual(await getFx(), 1)
})

test('should remove value from storage', async () => {
  const { setFx, getFx, removeFx } = createStorage<number>('test-get-set-1', {
    adapter,
  })

  await setFx(1)

  assert.strictEqual(await getFx(), 1)

  await removeFx()

  assert.strictEqual(await getFx(), undefined)
})

test('should get and set value from storage (with adapter factory)', async () => {
  const watch = mock.fn()

  const area = new Map<string, number>()
  const { getFx, setFx } = createStorage('test-get-set-2', {
    adapter: memory,
    area,
  })

  getFx.watch(watch)
  setFx.watch(watch)
  getFx.finally.watch(watch)
  setFx.finally.watch(watch)

  assert.strictEqual(watch.mock.callCount(), 0)

  getFx()

  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[0].arguments, [undefined]) // getFx trigger
  assert.deepEqual(watch.mock.calls[1].arguments, [
    {
      status: 'done',
      params: undefined,
      result: undefined,
    },
  ]) // getFx result

  setFx(1)

  assert.strictEqual(watch.mock.callCount(), 4)
  assert.deepEqual(watch.mock.calls[2].arguments, [1]) // setFx trigger
  assert.deepEqual(watch.mock.calls[3].arguments, [
    {
      status: 'done',
      params: 1,
      result: undefined,
    },
  ]) // setFx result

  assert.strictEqual(await getFx(), 1)
  assert.strictEqual(area.get('test-get-set-2'), 1)
})

test('should get and set value from async storage', async () => {
  const watch = mock.fn()

  const { getFx, setFx } = createStorage('test-get-set-3', {
    adapter: async(adapter),
  })

  getFx.watch(watch)
  setFx.watch(watch)
  getFx.finally.watch(watch)
  setFx.finally.watch(watch)

  assert.strictEqual(watch.mock.callCount(), 0)

  await getFx()

  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[0].arguments, [undefined]) // getFx trigger
  assert.deepEqual(watch.mock.calls[1].arguments, [
    {
      status: 'done',
      params: undefined,
      result: undefined,
    },
  ]) // getFx result

  await setFx(1)

  assert.strictEqual(watch.mock.callCount(), 4)
  assert.deepEqual(watch.mock.calls[2].arguments, [1]) // setFx trigger
  assert.deepEqual(watch.mock.calls[3].arguments, [
    {
      status: 'done',
      params: 1,
      result: undefined,
    },
  ]) // setFx result

  assert.strictEqual(await getFx(), 1)
})

test('should sync effects for the same adapter-key', () => {
  const watchSet = mock.fn()
  const watchGet = mock.fn()

  const { setFx } = createStorage({
    adapter,
    key: 'test-sync-same-key-1',
  })
  const { getFx } = createStorage({
    adapter,
    key: 'test-sync-same-key-1',
  })

  getFx.watch(watchGet)
  setFx.watch(watchSet)
  getFx.finally.watch(watchGet)
  setFx.finally.watch(watchSet)

  assert.strictEqual(watchSet.mock.callCount(), 0)
  assert.strictEqual(watchGet.mock.callCount(), 0)

  setFx(1)

  assert.strictEqual(watchSet.mock.callCount(), 2)
  assert.strictEqual(watchGet.mock.callCount(), 2)
  assert.deepEqual(watchSet.mock.calls[0].arguments, [1]) // setFx trigger
  assert.deepEqual(watchSet.mock.calls[1].arguments, [
    {
      status: 'done',
      params: 1,
      result: undefined,
    },
  ]) // setFx result
  assert.deepEqual(watchGet.mock.calls[0].arguments, [undefined]) // getFx trigger
  assert.deepEqual(watchGet.mock.calls[1].arguments, [
    {
      status: 'done',
      params: undefined,
      result: 1,
    },
  ]) // getFx result
})

test('should sync with `persist` for the same adapter-key', async () => {
  const watch = mock.fn()
  const watchFx = mock.fn()

  const $store = createStore(11)
  $store.watch(watch)

  assert.strictEqual($store.getState(), 11)
  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [11])

  persist({
    store: $store,
    adapter,
    key: 'test-sync-same-key-2',
  })

  assert.strictEqual($store.getState(), 11) // did not change
  assert.strictEqual(watch.mock.callCount(), 1) // did not trigger

  const { getFx, setFx } = createStorage({
    adapter,
    key: 'test-sync-same-key-2',
  })

  getFx.watch(watchFx)
  setFx.watch(watchFx)
  getFx.finally.watch(watchFx)
  setFx.finally.watch(watchFx)

  assert.strictEqual(watchFx.mock.callCount(), 0) // did not trigger

  setFx(22)

  assert.strictEqual(watchFx.mock.callCount(), 2)
  assert.deepEqual(watchFx.mock.calls[0].arguments, [22]) // setFx trigger
  assert.deepEqual(watchFx.mock.calls[1].arguments, [
    {
      status: 'done',
      params: 22,
      result: undefined,
    },
  ]) // setFx result

  assert.strictEqual($store.getState(), 22) // <- changed
  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[1].arguments, [22])

  //
  ;($store as any).setState(33)

  assert.strictEqual($store.getState(), 33)
  assert.strictEqual(watch.mock.callCount(), 3)
  assert.deepEqual(watch.mock.calls[2].arguments, [33])

  assert.strictEqual(watchFx.mock.callCount(), 4)
  assert.deepEqual(watchFx.mock.calls[2].arguments, [undefined]) // getFx trigger
  assert.deepEqual(watchFx.mock.calls[3].arguments, [
    {
      status: 'done',
      params: undefined,
      result: 33,
    },
  ]) // getFx result

  assert.strictEqual(await getFx(), 33)
})

test('should sync with `persist` for the same adapter-key when removing value', async () => {
  const watch = mock.fn()
  const watchFx = mock.fn()

  const storageArea = new Map<string, any>()
  const adapter = memory({ area: storageArea, def: 0 })
  storageArea.set('test-sync-same-key-3', -123)

  const $store = createStore(0)
  $store.watch(watch)

  assert.strictEqual($store.getState(), 0)
  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [0])

  persist({
    store: $store,
    adapter,
    key: 'test-sync-same-key-3',
  })

  assert.strictEqual($store.getState(), -123) // got from storage
  assert.strictEqual(watch.mock.callCount(), 2) // store got updated from storage

  const { removeFx } = createStorage({
    adapter,
    key: 'test-sync-same-key-3',
  })

  removeFx.watch(watchFx)
  removeFx.finally.watch(watchFx)

  assert.strictEqual(watchFx.mock.callCount(), 0) // did not trigger

  removeFx()

  assert.strictEqual(watchFx.mock.callCount(), 2)
  assert.deepEqual(watchFx.mock.calls[0].arguments, [undefined]) // removeFx trigger
  assert.deepEqual(watchFx.mock.calls[1].arguments, [
    {
      status: 'done',
      params: undefined,
      result: undefined,
    },
  ]) // removeFx result

  assert.strictEqual($store.getState(), 0) // <- changed to default state
  assert.strictEqual(watch.mock.callCount(), 3)
  assert.deepEqual(watch.mock.calls[2].arguments, [0])
})

test('should handle synchronous error in `get` and `set` effects', () => {
  const watch = mock.fn()

  const { getFx, setFx } = createStorage<number>('test-sync-throw', {
    adapter: () => ({
      get: () => {
        throw 'get test error'
      },
      set: () => {
        throw 'set test error'
      },
    }),
  })

  getFx.watch(watch)
  setFx.watch(watch)
  getFx.finally.watch(watch)
  setFx.finally.watch(watch)

  assert.strictEqual(watch.mock.callCount(), 0)

  getFx()

  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[0].arguments, [undefined]) // getFx trigger
  assert.deepEqual(watch.mock.calls[1].arguments, [
    {
      status: 'fail',
      params: undefined,
      error: {
        key: 'test-sync-throw',
        keyPrefix: '',
        operation: 'get',
        error: 'get test error',
        value: undefined,
      },
    },
  ]) // getFx fail

  setFx(1)

  assert.strictEqual(watch.mock.callCount(), 4)
  assert.deepEqual(watch.mock.calls[2].arguments, [1]) // setFx trigger
  assert.deepEqual(watch.mock.calls[3].arguments, [
    {
      status: 'fail',
      params: 1,
      error: {
        key: 'test-sync-throw',
        keyPrefix: '',
        operation: 'set',
        error: 'set test error',
        value: 1,
      },
    },
  ]) // setFx fail
})

test('should handle asynchronous error in `get` and `set` effects', async () => {
  const watch = mock.fn()

  const { getFx, setFx } = createStorage<number>('test-async-throw', {
    adapter: () => ({
      get: async () => Promise.reject('get test error'),
      set: async () => Promise.reject('set test error'),
    }),
  })

  getFx.watch(watch)
  setFx.watch(watch)
  getFx.finally.watch(watch)
  setFx.finally.watch(watch)

  assert.strictEqual(watch.mock.callCount(), 0)

  try {
    await getFx()
    assert.fail('getFx should have thrown')
  } catch (e) {
    // ok
  }

  assert.strictEqual(watch.mock.callCount(), 2)
  assert.deepEqual(watch.mock.calls[0].arguments, [undefined]) // getFx trigger
  assert.deepEqual(watch.mock.calls[1].arguments, [
    {
      status: 'fail',
      params: undefined,
      error: {
        key: 'test-async-throw',
        keyPrefix: '',
        operation: 'get',
        error: 'get test error',
        value: undefined,
      },
    },
  ]) // getFx fail

  try {
    await setFx(1)
    assert.fail('setFx should have thrown')
  } catch (e) {
    // ok
  }

  assert.strictEqual(watch.mock.callCount(), 4)
  assert.deepEqual(watch.mock.calls[2].arguments, [1]) // setFx trigger
  assert.deepEqual(watch.mock.calls[3].arguments, [
    {
      status: 'fail',
      params: 1,
      error: {
        key: 'test-async-throw',
        keyPrefix: '',
        operation: 'set',
        error: 'set test error',
        value: 1,
      },
    },
  ]) // setFx fail
})

test('should hide internal <error in "box"> implementation with `get` effect', () => {
  const watch = mock.fn()
  const fail = createEvent()

  const { getFx, setFx } = createStorage<number>('test-throw-box', {
    adapter: (_, update) => {
      fail.watch(() => {
        update(() => {
          throw 'get box test error'
        })
      })

      return {
        get: (box?: () => any) => {
          if (box) return box()
        },
        set: () => {},
      }
    },
  })

  getFx.watch(watch)
  setFx.watch(watch)
  getFx.finally.watch(watch)
  setFx.finally.watch(watch)

  assert.strictEqual(watch.mock.callCount(), 0)

  fail()

  assert.strictEqual(watch.mock.callCount(), 2)

  const arg1 = watch.mock.calls[0].arguments[0]
  assert.ok(arg1 instanceof Function) // getFx trigger - "box"ed error, don't know how to hide it here

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { params, ...arg2 } = watch.mock.calls[1].arguments[0]
  assert.deepEqual(arg2, {
    status: 'fail',
    // params: Function, // "box"ed error...
    error: {
      key: 'test-throw-box',
      keyPrefix: '',
      operation: 'get',
      error: 'get box test error',
      value: undefined,
    },
  }) // getFx fail
})
