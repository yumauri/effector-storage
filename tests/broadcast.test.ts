import { BroadcastChannel, Worker } from 'node:worker_threads'
import { createEffect, createStore, sample } from 'effector'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { broadcast as broadcastIndex } from '../src'
import { broadcast, persist } from '../src/broadcast'
import { log } from '../src/log'
import { either } from '../src/tools'
import { createEventsMock } from './mocks/events.mock'

//
// Helper to load scripts in worker
//

function createWorker(script: string): Worker {
  const workerCode = `
    import { BroadcastChannel } from 'node:worker_threads'
    import { createStore } from 'effector'
    import { persist } from '../src/broadcast'
    const channels = []
    class BroadcastChannelMock extends BroadcastChannel {
      constructor(name) {
        super(name)
        channels.push(this)
      }
    }
    global.BroadcastChannel = BroadcastChannelMock
    ${script}
    channels.forEach((channel) => channel.close())
  `

  return new Worker(
    `
    const esbuild = require('esbuild')
    const code = esbuild.buildSync({
      stdin: { contents: ${JSON.stringify(workerCode)}, resolveDir: './tests' },
      bundle: true,
      minify: true,
      platform: 'node',
      external: ['effector'],
      write: false,
    }).outputFiles[0].text
    eval(code)
    `,
    { eval: true }
  )
}

//
// Mock events
//

declare let global: any
const channels: BroadcastChannel[] = []

beforeAll(() => {
  // mock BroadcastChannel in order to save all created instances of BroadcastChannel
  class BroadcastChannelMock extends BroadcastChannel {
    constructor(name: string) {
      super(name)
      channels.push(this)
    }
  }
  global.BroadcastChannel = BroadcastChannelMock
})

afterAll(() => {
  // close all channels after tests, so node will not hang
  for (const channel of channels) {
    channel.close()
  }
})

//
// Tests
//

it('should export adapter and `persist` function', () => {
  expect(typeof broadcast === 'function').toBeTruthy()
  expect(typeof persist === 'function').toBeTruthy()
})

it('should be exported from package root', () => {
  expect(broadcast).toBe(broadcastIndex)
})

it('should be ok on good parameters', () => {
  const $store = createStore(0, { name: 'broadcast' })
  expect(() => persist({ store: $store })).not.toThrow()
})

it('should post message to broadcast channel on updates', async () => {
  const channel = new BroadcastChannel('shared_counter')
  const receive = new Promise((resolve) => {
    channel.onmessage = ({ data }: any) => resolve(data)
  })

  const $counter = createStore(0)
  persist({
    store: $counter,
    key: 'counter',
    channel: 'shared_counter',
  })

  //
  ;($counter as any).setState(42)

  const got = await receive
  channel.close()

  expect(got).toEqual({ key: 'counter', value: 42 })
})

// this is REAL test in node environment
// which spawns worker and checks communication between worker and main thread
// via BroadcastChannel adapter
it('should synchronize store state with worker', async () => {
  const watchFinally = vi.fn()
  const watchTarget = vi.fn()

  // create store in main thread
  const $token = createStore('old_token')
  persist({
    store: $token,
    key: 'token',
    finally: createEffect(watchFinally),
  })
  sample({
    clock: $token,
    target: createEffect(watchTarget),
  })

  const worker = createWorker(
    `
    const $token = createStore('old_token')
    persist({
      store: $token,
      key: 'token',
    })
    $token.setState('new_token')
    `
  )

  await new Promise((resolve) => {
    worker.once('exit', resolve)
  })

  expect(watchTarget).toHaveBeenCalledTimes(1)
  expect(watchTarget.mock.calls[0]).toEqual(['new_token'])
  expect(watchFinally).toHaveBeenCalledTimes(2)
  expect(watchFinally.mock.calls[0]).toEqual([
    {
      key: 'token',
      keyPrefix: '',
      operation: 'get',
      status: 'done',
      value: undefined,
    },
  ])
  expect(watchFinally.mock.calls[1]).toEqual([
    {
      key: 'token',
      keyPrefix: '',
      operation: 'get',
      status: 'done',
      value: 'new_token',
    },
  ])
})

// this is FAKE test, I couln't find a way to trigger `messageerror` event in node
// looks like even node developers are not sure how to do it:
// https://github.com/nodejs/node/issues/36333#issuecomment-740238122
// https://github.com/nodejs/node/pull/36780/files
// in browser it is possible to trigger `messageerror` event by sending `SharedArrayBuffer`
// but I will test it in new browser e2e tests, in node it is not possible
it('should fail on `messageerror`', async () => {
  const _BroadcastChannel = global.BroadcastChannel
  const events = createEventsMock()

  global.BroadcastChannel = class BroadcastChannelMock {
    public name: string

    constructor(name: string) {
      this.name = name
    }

    addEventListener(name: string, listener: EventListener) {
      return events.addEventListener(name, listener)
    }
  }

  try {
    const watchFail = vi.fn()

    const $test = createStore('')
    persist({
      store: $test,
      key: 'test',
      channel: 'test',
      fail: createEffect(watchFail),
    })

    {
      await events.dispatchEvent('messageerror', { data: null })

      expect(watchFail).toHaveBeenCalledTimes(1)
      const { error, ...rest } = watchFail.mock.calls[0][0]
      expect(rest).toEqual({
        key: 'test',
        keyPrefix: '',
        operation: 'get',
        value: undefined,
      })
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toMatch(/Unable to deserialize message/)
    }

    {
      // chromium can call `message` instead of `messageerror`, with `null` as message's data
      // so, cover this case too
      await events.dispatchEvent('message', { data: null })

      expect(watchFail).toHaveBeenCalledTimes(2)
      const { error, ...rest } = watchFail.mock.calls[1][0]
      expect(rest).toEqual({
        key: 'test',
        keyPrefix: '',
        operation: 'get',
        value: undefined,
      })
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toMatch(/Unable to deserialize message/)
    }
  } finally {
    global.BroadcastChannel = _BroadcastChannel
  }
})

it('should be nil adapter in unsupported environment', async () => {
  const _BroadcastChannel = global.BroadcastChannel
  global.BroadcastChannel = undefined
  try {
    const logger = vi.fn()

    const adapter = either(broadcast, log({ logger }))()
    adapter('unsupported', () => undefined).get()

    expect(logger.mock.calls[0]).toEqual([
      '[log adapter] get value for key "unsupported"',
    ])
  } finally {
    global.BroadcastChannel = _BroadcastChannel
  }
})
