// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="node" />

import { test } from 'uvu'
import { snoop } from 'snoop'
import * as assert from 'uvu/assert'
import { BroadcastChannel, Worker } from 'node:worker_threads'
import { createEffect, createStore, sample } from 'effector'
import { createEventsMock } from './mocks/events.mock'
import { broadcast, persist } from '../src/broadcast'
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

test.before(() => {
  // mock BroadcastChannel in order to save all created instances of BroadcastChannel
  class BroadcastChannelMock extends BroadcastChannel {
    constructor(name: string) {
      super(name)
      channels.push(this)
    }
  }
  global.BroadcastChannel = BroadcastChannelMock
})

test.after(() => {
  // close all channels after tests, so node will not hang
  channels.forEach((channel) => channel.close())
})

//
// Tests
//

test('should export adapter and `persist` function', () => {
  assert.type(broadcast, 'function')
  assert.type(persist, 'function')
})

test('should be exported from package root', () => {
  assert.is(broadcast, broadcastIndex)
})

test('should be ok on good parameters', () => {
  const $store = createStore(0, { name: 'broadcast' })
  assert.not.throws(() => persist({ store: $store }))
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

  assert.equal(got, { key: 'counter', value: 42 })
})

// this is REAL test in node environment
// which spawns worker and checks communication between worker and main thread
// via BroadcastChannel adapter
test('should syncronize store state with worker', async () => {
  const watchFinally = snoop(() => undefined)
  const watchTarget = snoop(() => undefined)

  // create store in main thread
  const $token = createStore('old_token')
  persist({
    store: $token,
    key: 'token',
    finally: createEffect<any, any>(watchFinally.fn),
  })
  sample({
    clock: $token,
    target: createEffect<any, any>(watchTarget.fn),
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

  assert.is(watchTarget.callCount, 1)
  assert.equal(watchTarget.calls[0].arguments, ['new_token'])
  assert.is(watchFinally.callCount, 2)
  assert.equal(watchFinally.calls[0].arguments, [
    {
      key: 'token',
      keyPrefix: '',
      operation: 'get',
      status: 'done',
      value: undefined,
    },
  ])
  assert.equal(watchFinally.calls[1].arguments, [
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
    const watchFail = snoop(() => undefined)

    const $test = createStore('')
    persist({
      store: $test,
      key: 'test',
      channel: 'test',
      fail: createEffect<any, any>(watchFail.fn),
    })

    {
      await events.dispatchEvent('messageerror', { data: null })

      assert.is(watchFail.callCount, 1)
      const { error, ...rest } = watchFail.calls[0].arguments[0 as any] as any
      assert.equal(rest, {
        key: 'test',
        keyPrefix: '',
        operation: 'get',
        value: undefined,
      })
      assert.match(error, /Unable to deserialize message/)
    }

    {
      // chromium can call `message` instead of `messageerror`, with `null` as message's data
      // so, cover this case too
      await events.dispatchEvent('message', { data: null })

      assert.is(watchFail.callCount, 2)
      const { error, ...rest } = watchFail.calls[1].arguments[0 as any] as any
      assert.equal(rest, {
        key: 'test',
        keyPrefix: '',
        operation: 'get',
        value: undefined,
      })
      assert.match(error, /Unable to deserialize message/)
    }
  } finally {
    global.BroadcastChannel = _BroadcastChannel
  }
})

test('should be nil adapter in unsupported environment', async () => {
  const _BroadcastChannel = global.BroadcastChannel
  delete global.BroadcastChannel
  try {
    const logger = snoop(() => undefined)

    const adapter = either(broadcast, log({ logger: logger.fn }))()
    adapter('unsupported', () => undefined).get()

    assert.equal(logger.calls[0].arguments, [
      '[log adapter] get value for key "unsupported"',
    ])
  } finally {
    global.BroadcastChannel = _BroadcastChannel
  }
})

//
// Launch tests
//

test.run()
