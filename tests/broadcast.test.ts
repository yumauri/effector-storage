import { test, before, after, mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { BroadcastChannel, Worker } from 'node:worker_threads'
import { createEffect, createStore, sample } from 'effector'
import { createEventsMock } from './mocks/events.mock'
import { broadcast, persist, createStorage } from '../src/broadcast'
import { broadcast as broadcastIndex } from '../src'
import { either } from '../src/tools'
import { log } from '../src/log'

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

before(() => {
  // mock BroadcastChannel in order to save all created instances of BroadcastChannel
  class BroadcastChannelMock extends BroadcastChannel {
    constructor(name: string) {
      super(name)
      channels.push(this)
    }
  }
  global.BroadcastChannel = BroadcastChannelMock
})

after(() => {
  // close all channels after tests, so node will not hang
  for (const channel of channels) {
    channel.close()
  }
})

//
// Tests
//

test('should export adapter and `persist` function', () => {
  assert.ok(typeof broadcast === 'function')
  assert.ok(typeof persist === 'function')
  assert.ok(typeof createStorage === 'function')
})

test('should be exported from package root', () => {
  assert.strictEqual(broadcast, broadcastIndex)
})

test('should be ok on good parameters', () => {
  const $store = createStore(0, { name: 'broadcast' })
  assert.doesNotThrow(() => persist({ store: $store }))
  assert.doesNotThrow(() => createStorage('broadcast'))
  assert.doesNotThrow(() => createStorage({ key: 'broadcast' }))
})

test('should post message to broadcast channel on updates', async () => {
  const channel = new BroadcastChannel('shared_counter')
  const recieve = new Promise((resolve) => {
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

  const got = await recieve
  channel.close()

  assert.deepEqual(got, { key: 'counter', value: 42 })
})

// this is REAL test in node environment
// which spawns worker and checks communication between worker and main thread
// via BroadcastChannel adapter
test('should syncronize store state with worker', async () => {
  const watchFinally = mock.fn()
  const watchTarget = mock.fn()

  // create store in main thread
  const $token = createStore('old_token')
  persist({
    store: $token,
    key: 'token',
    finally: createEffect<any, any>(watchFinally),
  })
  sample({
    clock: $token,
    target: createEffect<any, any>(watchTarget),
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

  assert.strictEqual(watchTarget.mock.callCount(), 1)
  assert.deepEqual(watchTarget.mock.calls[0].arguments, ['new_token'])
  assert.strictEqual(watchFinally.mock.callCount(), 2)
  assert.deepEqual(watchFinally.mock.calls[0].arguments, [
    {
      key: 'token',
      keyPrefix: '',
      operation: 'get',
      status: 'done',
      value: undefined,
    },
  ])
  assert.deepEqual(watchFinally.mock.calls[1].arguments, [
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
test('should fail on `messageerror`', async () => {
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
    const watchFail = mock.fn()

    const $test = createStore('')
    persist({
      store: $test,
      key: 'test',
      channel: 'test',
      fail: createEffect<any, any>(watchFail),
    })

    {
      await events.dispatchEvent('messageerror', { data: null })

      assert.strictEqual(watchFail.mock.callCount(), 1)
      const { error, ...rest } = watchFail.mock.calls[0].arguments[
        0 as any
      ] as any
      assert.deepEqual(rest, {
        key: 'test',
        keyPrefix: '',
        operation: 'get',
        value: undefined,
      })
      assert.ok(error instanceof Error)
      assert.match(error.message, /Unable to deserialize message/)
    }

    {
      // chromium can call `message` instead of `messageerror`, with `null` as message's data
      // so, cover this case too
      await events.dispatchEvent('message', { data: null })

      assert.strictEqual(watchFail.mock.callCount(), 2)
      const { error, ...rest } = watchFail.mock.calls[1].arguments[
        0 as any
      ] as any
      assert.deepEqual(rest, {
        key: 'test',
        keyPrefix: '',
        operation: 'get',
        value: undefined,
      })
      assert.ok(error instanceof Error)
      assert.match(error.message, /Unable to deserialize message/)
    }
  } finally {
    global.BroadcastChannel = _BroadcastChannel
  }
})

test('should be nil adapter in unsupported environment', async () => {
  const _BroadcastChannel = global.BroadcastChannel
  global.BroadcastChannel = undefined
  try {
    const logger = mock.fn()

    const adapter = either(broadcast, log({ logger }))()
    adapter('unsupported', () => undefined).get()

    assert.deepEqual(logger.mock.calls[0].arguments, [
      '[log adapter] get value for key "unsupported"',
    ])
  } finally {
    global.BroadcastChannel = _BroadcastChannel
  }
})
