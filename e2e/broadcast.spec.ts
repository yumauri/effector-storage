import { test, expect } from '@playwright/test'
import { snoop } from 'snoop'
import * as effectorMod from 'effector'
import * as libMod from '../src'

// this variables available globally in e2e/empty-app
// I just declare them here to make TS happy
declare const effector: typeof effectorMod
declare const lib: typeof libMod
declare const createWorker: () => Promise<Worker>
declare const createSharedWorker: () => Promise<SharedWorker>
// declare const evalWorker: (code: string) => any
declare const evalSharedWorker: (code: string) => any
declare const onMessage: (handler: (data: any) => void) => void
declare const watchFn: (...args: any[]) => any
declare const messageFn: (...args: any[]) => any

test('should sync store values between tabs', async ({ context }) => {
  const watch = snoop(() => undefined)

  // open two tabs
  const tab1 = await context.newPage()
  const tab2 = await context.newPage()

  // expose `watchFn` to the tab1
  await tab1.exposeFunction('watchFn', watch.fn)

  // promise to wait for console.log in tab1
  const consoleLog = tab1.waitForEvent('console', {
    predicate: (msg) => msg.type() === 'log',
  })

  // open tab1 and setup store with `persist`
  // `persist` should update store on event from other tab
  await tab1.goto('/')
  await tab1.evaluate(() => {
    const watch = effector.createEffect(watchFn)
    const $token = effector.createStore('old_token')
    lib.persist({
      store: $token,
      key: 'token',
      adapter: lib.broadcast,
      finally: watch,
    })
    effector.sample({
      clock: $token,
      target: effector.createEffect(console.log),
    })
  })

  // open tab2 and setup store with `persist`
  // store updates will be broadcasted to other tabs
  await tab2.goto('/')
  await tab2.evaluate(() => {
    const $token = effector.createStore('old_token')
    lib.persist({
      store: $token,
      key: 'token',
      adapter: lib.broadcast,
    })
    ;($token as any).setState('new_token')
  })

  // wait for console.log in tab1
  const msg = await consoleLog

  // check that store was updated in tab1
  expect(msg.text()).toBe('new_token')
  expect(watch.callCount).toBe(2)
  expect(watch.calls[0].arguments).toEqual([
    {
      key: 'token',
      keyPrefix: '',
      operation: 'get',
      status: 'done',
      value: undefined,
    },
  ])
  expect(watch.calls[1].arguments).toEqual([
    {
      key: 'token',
      keyPrefix: '',
      operation: 'get',
      status: 'done',
      value: 'new_token',
    },
  ])
})

test('should sync store values between tab and worker', async ({ context }) => {
  const watch = snoop(() => undefined)

  // open tab
  const tab = await context.newPage()

  // expose `watchFn` to the tab
  await tab.exposeFunction('watchFn', watch.fn)

  // promise to wait for console.log in tab1
  const consoleLog = tab.waitForEvent('console', {
    predicate: (msg) => msg.type() === 'log',
  })

  // promise to wait for worker to be spawned
  const waitWorker = tab.waitForEvent('worker')

  // open tab and setup store with `persist`
  // `persist` should update store on event from other tab
  await tab.goto('/')
  await tab.evaluate(async () => {
    const watch = effector.createEffect(watchFn)
    const $token = effector.createStore('old_token')
    lib.persist({
      store: $token,
      key: 'token',
      adapter: lib.broadcast,
      finally: watch,
    })
    effector.sample({
      clock: $token,
      target: effector.createEffect(console.log),
    })
    await createWorker()
  })

  // wait for worker to be spawned, and setup store with `persist`
  // store updates will be broadcasted to tab
  const worker = await waitWorker
  worker.evaluate(() => {
    const $token = effector.createStore('old_token')
    lib.persist({
      store: $token,
      key: 'token',
      adapter: lib.broadcast,
    })
    ;($token as any).setState('new_token')
  })

  // wait for console.log in tab
  const msg = await consoleLog

  // check that store was updated in tab
  expect(msg.text()).toBe('new_token')
  expect(watch.callCount).toBe(2)
  expect(watch.calls[0].arguments).toEqual([
    {
      key: 'token',
      keyPrefix: '',
      operation: 'get',
      status: 'done',
      value: undefined,
    },
  ])
  expect(watch.calls[1].arguments).toEqual([
    {
      key: 'token',
      keyPrefix: '',
      operation: 'get',
      status: 'done',
      value: 'new_token',
    },
  ])
})

test('should fail on `messageerror`', async ({ context }) => {
  // open tab
  const tab = await context.newPage()
  await tab.goto('/')

  // ensure that tab is cross-origin isolated and has `SharedArrayBuffer`
  expect(
    await tab.evaluate(
      () => `${crossOriginIsolated}|${typeof SharedArrayBuffer}`
    )
  ).toBe('true|function')

  // expose spy functions
  const message = snoop(() => undefined)
  await tab.exposeFunction('messageFn', message.fn)

  // promise to wait for console.log in tab1
  const consoleLog = tab.waitForEvent('console', {
    predicate: (msg) => msg.type() === 'log',
  })

  // spawn web worker and shared worker from tab
  await tab.evaluate(async () => {
    onMessage(({ payload }) => {
      messageFn(payload)
      console.log('done')
    })

    await createSharedWorker()

    // setup store in shared worker with `persist`
    // `persist` should trigger `fail` upon recieving SharedArrayBuffer
    await evalSharedWorker(
      `
      const watch = effector.createEvent()
      const $store = effector.createStore(null)
      void lib.persist({
        store: $store,
        key: 'store',
        adapter: lib.broadcast,
        channel: 'fail_bus',
        finally: watch,
      })
      void watch.watch((payload) => {
        channel.postMessage({
          src: 'sharedworker',
          dst: 'tab',
          type: 'message',
          payload,
        })
      })
      `
    )

    const $store = effector.createStore(null)
    lib.persist({
      store: $store,
      key: 'store',
      adapter: lib.broadcast,
      channel: 'fail_bus',
    })
    ;($store as any).setState(new SharedArrayBuffer(8))
  })

  // wait for console.log in tab
  await consoleLog

  // check that `fail` was called
  expect(message.callCount).toBe(1)
  const { error, ...rest } = message.calls[0].arguments[0 as any] as any
  expect(rest).toEqual({
    key: 'store',
    keyPrefix: '',
    operation: 'get',
    status: 'fail',
    value: undefined,
  })
  expect(String(error)).toMatch(/Unable to deserialize message/)
})
