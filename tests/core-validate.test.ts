import type { StorageAdapter } from '../src'
import { superstructContract } from '@farfetched/superstruct'
import { type } from 'arktype'
import { createEvent, createStore } from 'effector'
import * as s from 'superstruct'
import * as v from 'valibot'
import { expect, it, vi } from 'vitest'
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

it('should allow undefined schema for validation (valid)', () => {
  const watch = vi.fn()
  const $data = createStore(null)
  const fail = createEvent<any>()
  fail.watch(watch)

  persist({
    adapter: dumbAdapter({ any: 'data' }),
    store: $data,
    key: 'data',
    fail,
  })

  expect($data.getState()).toEqual({ any: 'data' })

  expect(watch).toHaveBeenCalledTimes(0)
})

it('should fail on invalid schema (string)', () => {
  const watch = vi.fn()
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

  expect($data.getState()).toBe(null)

  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0]).toEqual([
    {
      key: 'data',
      keyPrefix: '',
      operation: 'validate',
      error: ['Invalid contract'],
      value: { any: 'data' },
    },
  ])
})

it('should fail on invalid schema (object)', () => {
  const watch = vi.fn()
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

  expect($data.getState()).toBe(null)

  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0]).toEqual([
    {
      key: 'data',
      keyPrefix: '',
      operation: 'validate',
      error: ['Invalid contract'],
      value: { any: 'data' },
    },
  ])
})

it('should validate with function (valid)', () => {
  const watch = vi.fn()
  const $data = createStore<string | null>(null)
  const fail = createEvent<any>()
  fail.watch(watch)

  persist({
    adapter: dumbAdapter('any data'),
    store: $data,
    key: 'data',
    contract: (raw): raw is string => typeof raw === 'string',
    fail,
  })

  expect($data.getState()).toBe('any data')

  expect(watch).toHaveBeenCalledTimes(0)
})

it('should validate with function (invalid)', () => {
  const watch = vi.fn()
  const $data = createStore<number | null>(null)
  const fail = createEvent<any>()
  fail.watch(watch)

  persist({
    adapter: dumbAdapter('any data'),
    store: $data,
    key: 'data',
    contract: (raw): raw is number => typeof raw === 'number',
    fail,
  })

  expect($data.getState()).toBe(null)

  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0]).toEqual([
    {
      key: 'data',
      keyPrefix: '',
      operation: 'validate',
      error: ['Invalid data'],
      value: 'any data',
    },
  ])
})

it('should validate against contract protocol (simple, valid)', () => {
  const watch = vi.fn()
  const $data = createStore<string | null>(null)
  const fail = createEvent<any>()
  fail.watch(watch)

  persist({
    adapter: dumbAdapter('any data'),
    store: $data,
    key: 'data',
    contract: superstructContract(s.string()),
    fail,
  })

  expect($data.getState()).toBe('any data')

  expect(watch).toHaveBeenCalledTimes(0)
})

it('should validate against contract protocol (complex, valid)', () => {
  const watch = vi.fn()
  const $data = createStore<{ type: 'asteroid'; mass: number } | null>(null)
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

  expect($data.getState()).toEqual({ type: 'asteroid', mass: 42 })

  expect(watch).toHaveBeenCalledTimes(0)
})

it('should validate against contract protocol (invalid)', () => {
  const watch = vi.fn()
  const $data = createStore<{ type: 'asteroid'; mass: number } | null>(null)
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

  expect($data.getState()).toBe(null)

  expect(watch).toHaveBeenCalledTimes(1)
  expect(watch.mock.calls[0]).toEqual([
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

it('should validate against standard schema (simple, valid)', () => {
  const watch = vi.fn()
  const $data = createStore<string | null>(null)
  const fail = createEvent<any>()
  fail.watch(watch)

  persist({
    adapter: dumbAdapter('any data'),
    store: $data,
    key: 'data',
    contract: type('string'),
    fail,
  })

  expect($data.getState()).toBe('any data')

  expect(watch).toHaveBeenCalledTimes(0)
})

it('should validate against standard schema (complex, valid)', () => {
  const watch = vi.fn()
  const $data = createStore<{ type: string; mass: number } | null>(null)
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

  expect($data.getState()).toEqual({ type: 'asteroid', mass: 42 })

  expect(watch).toHaveBeenCalledTimes(0)
})

it('should validate against standard schema (invalid)', () => {
  const watch = vi.fn()
  const $data = createStore<string | null>(null)
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

  expect($data.getState()).toBe(null)

  expect(watch).toHaveBeenCalledTimes(1)

  // do not compare full equality, because error is a complex ArkErrors object
  // so we just check if the summary
  const args = watch.mock.calls[0]
  expect(args[0].error.summary).toEqual('must be a string (was a number)')
})

it('should validate against async standard schema (valid)', async () => {
  const watch = vi.fn()
  const $data = createStore<{ type: string; mass: number } | null>(null)
  const fail = createEvent<any>()
  fail.watch(watch)

  const schema = v.objectAsync({
    type: v.pipeAsync(
      v.string(),
      v.checkAsync(async (value) => value === 'asteroid')
    ),
    mass: v.number(),
  })

  persist({
    adapter: dumbAdapter({ type: 'asteroid', mass: 42 }),
    store: $data,
    key: 'data',
    contract: schema,
    fail,
  })

  await new Promise((resolve) => setTimeout(resolve, 0))

  expect($data.getState()).toEqual({ type: 'asteroid', mass: 42 })
  expect(watch).toHaveBeenCalledTimes(0)
})

it('should validate against async standard schema (invalid)', async () => {
  const watch = vi.fn()
  const $data = createStore<string | null>(null)
  const fail = createEvent<any>()
  fail.watch(watch)

  const schema = v.pipeAsync(
    v.string(),
    v.checkAsync(async (value) => value === 'asteroid')
  )

  persist({
    adapter: dumbAdapter(42),
    store: $data,
    key: 'data',
    contract: schema,
    fail,
  })

  await new Promise((resolve) => setTimeout(resolve, 0))

  expect($data.getState()).toBe(null)
  expect(watch).toHaveBeenCalledTimes(1)

  // do not compare full equality, because error is a complex Valibot object
  // so we just check if the message
  const args = watch.mock.calls[0]
  expect(args[0].error[0].message).toEqual(
    'Invalid type: Expected string but received 42'
  )
})
