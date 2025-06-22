import type { StorageAdapter } from '../src'
import { test, mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { createEvent, createStore } from 'effector'
import * as s from 'superstruct'
import { type } from 'arktype'
import { superstructContract } from '@farfetched/superstruct'
import { persist } from '../src/core'

//
// Dumb fake adapter
//

const dumbAdapter = (initial: any): StorageAdapter => {
  return <T>() => {
    let __: T = initial
    return {
      get: (): T => __,
      set: (value: T) => void (__ = value),
    }
  }
}

//
// Tests
//

test('should allow undefined schema for validation (valid)', () => {
  const watch = mock.fn()
  const $data = createStore(null)
  const fail = createEvent<any>()
  fail.watch(watch)

  persist({
    adapter: dumbAdapter({ any: 'data' }),
    store: $data,
    key: 'data',
    fail,
  })

  assert.deepEqual($data.getState(), { any: 'data' })

  assert.strictEqual(watch.mock.callCount(), 0)
})

test('should fail on invalid schema (string)', () => {
  const watch = mock.fn()
  const $data = createStore(null)
  const fail = createEvent<any>()
  fail.watch(watch)

  persist({
    adapter: dumbAdapter({ any: 'data' }),
    store: $data,
    key: 'data',
    contract: 'invalid schema' as any,
    fail,
  })

  assert.strictEqual($data.getState(), null)

  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [
    {
      key: 'data',
      keyPrefix: '',
      operation: 'validate',
      error: ['Invalid contract'],
      value: { any: 'data' },
    },
  ])
})

test('should fail on invalid schema (object)', () => {
  const watch = mock.fn()
  const $data = createStore(null)
  const fail = createEvent<any>()
  fail.watch(watch)

  persist({
    adapter: dumbAdapter({ any: 'data' }),
    store: $data,
    key: 'data',
    contract: {} as any,
    fail,
  })

  assert.strictEqual($data.getState(), null)

  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [
    {
      key: 'data',
      keyPrefix: '',
      operation: 'validate',
      error: ['Invalid contract'],
      value: { any: 'data' },
    },
  ])
})

test('should validate with function (valid)', () => {
  const watch = mock.fn()
  const $data = createStore(null)
  const fail = createEvent<any>()
  fail.watch(watch)

  persist({
    adapter: dumbAdapter('any data'),
    store: $data,
    key: 'data',
    contract: (raw): raw is string => typeof raw === 'string',
    fail,
  })

  assert.strictEqual($data.getState(), 'any data')

  assert.strictEqual(watch.mock.callCount(), 0)
})

test('should validate with function (invalid)', () => {
  const watch = mock.fn()
  const $data = createStore(null)
  const fail = createEvent<any>()
  fail.watch(watch)

  persist({
    adapter: dumbAdapter('any data'),
    store: $data,
    key: 'data',
    contract: (raw): raw is number => typeof raw === 'number',
    fail,
  })

  assert.strictEqual($data.getState(), null)

  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [
    {
      key: 'data',
      keyPrefix: '',
      operation: 'validate',
      error: ['Invalid data'],
      value: 'any data',
    },
  ])
})

test('should validate against contract protocol (simple, valid)', () => {
  const watch = mock.fn()
  const $data = createStore(null)
  const fail = createEvent<any>()
  fail.watch(watch)

  persist({
    adapter: dumbAdapter('any data'),
    store: $data,
    key: 'data',
    contract: superstructContract(s.string()),
    fail,
  })

  assert.strictEqual($data.getState(), 'any data')

  assert.strictEqual(watch.mock.callCount(), 0)
})

test('should validate against contract protocol (complex, valid)', () => {
  const watch = mock.fn()
  const $data = createStore(null)
  const fail = createEvent<any>()
  fail.watch(watch)

  const Asteroid = s.type({
    type: s.literal('asteroid'),
    mass: s.number(),
  })

  persist({
    adapter: dumbAdapter({ type: 'asteroid', mass: 42 }),
    store: $data,
    key: 'data',
    contract: superstructContract(Asteroid),
    fail,
  })

  assert.deepEqual($data.getState(), { type: 'asteroid', mass: 42 })

  assert.strictEqual(watch.mock.callCount(), 0)
})

test('should validate against contract protocol (invalid)', () => {
  const watch = mock.fn()
  const $data = createStore(null)
  const fail = createEvent<any>()
  fail.watch(watch)

  const Asteroid = s.type({
    type: s.literal('asteroid'),
    mass: s.number(),
  })

  persist({
    adapter: dumbAdapter({
      type: 'not asteroid',
      mass: Number.POSITIVE_INFINITY,
    }),
    store: $data,
    key: 'data',
    contract: superstructContract(Asteroid),
    fail,
  })

  assert.strictEqual($data.getState(), null)

  assert.strictEqual(watch.mock.callCount(), 1)
  assert.deepEqual(watch.mock.calls[0].arguments, [
    {
      key: 'data',
      keyPrefix: '',
      operation: 'validate',
      error: [
        'type: Expected the literal `"asteroid"`, but received: "not asteroid"',
      ],
      value: { type: 'not asteroid', mass: Number.POSITIVE_INFINITY },
    },
  ])
})

test('should validate against standard schema (simple, valid)', () => {
  const watch = mock.fn()
  const $data = createStore(null)
  const fail = createEvent<any>()
  fail.watch(watch)

  persist({
    adapter: dumbAdapter('any data'),
    store: $data,
    key: 'data',
    contract: type('string'),
    fail,
  })

  assert.strictEqual($data.getState(), 'any data')

  assert.strictEqual(watch.mock.callCount(), 0)
})

test('should validate against standard schema (complex, valid)', () => {
  const watch = mock.fn()
  const $data = createStore(null)
  const fail = createEvent<any>()
  fail.watch(watch)

  const schema = type({
    type: 'string',
    mass: 'number',
  })

  persist({
    adapter: dumbAdapter({ type: 'asteroid', mass: 42 }),
    store: $data,
    key: 'data',
    contract: schema,
    fail,
  })

  assert.deepEqual($data.getState(), { type: 'asteroid', mass: 42 })

  assert.strictEqual(watch.mock.callCount(), 0)
})

test('should validate against standard schema (invalid)', () => {
  const watch = mock.fn()
  const $data = createStore(null)
  const fail = createEvent<any>()
  fail.watch(watch)

  const schema = type('string')

  persist({
    adapter: dumbAdapter(42),
    store: $data,
    key: 'data',
    contract: schema,
    fail,
  })

  assert.strictEqual($data.getState(), null)

  assert.strictEqual(watch.mock.callCount(), 1)

  // do not compare full equality, because error is a complex ArkErrors object
  // so we just check if the summary
  const args = watch.mock.calls[0]?.arguments as any[]
  assert.deepEqual(args?.[0]?.error?.summary, 'must be a string (was a number)')
})

test.skip('should validate against async schema (valid)', () => {
  // TODO: after valibot 1.0.0 is released
})
