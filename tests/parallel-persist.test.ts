import type { StorageAdapter } from '../src/types'
import { test } from 'uvu'
import {
  allSettled,
  createEffect,
  createEvent,
  createStore,
  fork,
  sample,
} from 'effector'
import { persist } from '../src'

//
// Noop fake adapter
//

const noopAdapter: StorageAdapter = () =>
  <any>{
    get() {},
    set() {},
  }

//
// Tests
//

test('(no scope) parallel persists should not stuck in dead lock', () => {
  const fx = createEffect((data: number) => data)
  const api = createEffect(fx)
  const $store = createStore<number>(0).on(fx, (_, value) => value)

  persist({
    store: $store,
    adapter: noopAdapter,
    key: 'parallel1',
  })

  const run = createEvent()
  sample({
    clock: run,
    target: [api.prepend(() => 1), api.prepend(() => 2)],
  })
  run()

  // this test just working already asserts absense of dead lock,
  // no need for extra assert checks
})

test('(scope) parallel persists should not stuck in dead lock', async () => {
  const fx = createEffect((data: number) => data)
  const api = createEffect(fx)
  const $store = createStore<number>(0).on(fx, (_, value) => value)

  persist({
    store: $store,
    adapter: noopAdapter,
    key: 'parallel2',
  })

  const run = createEvent()
  sample({
    clock: run,
    target: [api.prepend(() => 3), api.prepend(() => 4)],
  })

  const scope = fork()
  await allSettled(run, { scope })

  // this test just working already asserts absense of dead lock,
  // no need for extra assert checks
})

//
// Launch tests
//

test.run()
