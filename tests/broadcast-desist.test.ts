// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="node" />

import { test } from 'uvu'
import { snoop } from 'snoop'
import * as assert from 'uvu/assert'
import { createEffect, createStore } from 'effector'
import { createEventsMock } from './mocks/events.mock'
import { persist } from '../src/broadcast'

//
// Mock events
//

declare let global: any

//
// Tests
//

test('should stop react on `message` and `messageerror` after desist', async () => {
  const _BroadcastChannel = global.BroadcastChannel
  const events = createEventsMock()
  const addListener = snoop(events.addEventListener)
  const removeListener = snoop(events.removeEventListener)

  global.BroadcastChannel = class BroadcastChannelMock {
    public name: string

    constructor(name: string) {
      this.name = name
    }

    addEventListener(name: string, listener: EventListener) {
      return addListener.fn(name, listener)
    }

    removeEventListener(name: string, listener: EventListener) {
      return removeListener.fn(name, listener)
    }
  }

  try {
    const watch = snoop(() => undefined)

    const $test = createStore('')
    const desist = persist({
      store: $test,
      key: 'test-desist',
      channel: 'test-desist',
      done: createEffect<any, any>(watch.fn),
      fail: createEffect<any, any>(watch.fn),
    })

    assert.is(addListener.callCount, 2)
    assert.equal(addListener.calls[0].arguments[0], 'message')
    assert.equal(addListener.calls[1].arguments[0], 'messageerror')

    const messageListener = addListener.calls[0].arguments[1]
    const messageerrorListener = addListener.calls[1].arguments[1]

    assert.is(watch.callCount, 1) // <- initial get call

    // stop persisting
    desist()

    assert.is(addListener.callCount, 2) // <- not changed
    assert.is(removeListener.callCount, 2)
    assert.equal(removeListener.calls[0].arguments[0], 'message')
    assert.equal(removeListener.calls[1].arguments[0], 'messageerror')

    assert.is(addListener.calls[0].arguments[1], messageListener)
    assert.is(addListener.calls[1].arguments[1], messageerrorListener)

    await events.dispatchEvent('message', { data: null })
    assert.is(watch.callCount, 1) // <- not changed

    await events.dispatchEvent('messageerror', { data: null })
    assert.is(watch.callCount, 1) // <- not changed
  } finally {
    global.BroadcastChannel = _BroadcastChannel
  }
})

//
// Launch tests
//

test.run()
