import { test, mock } from 'node:test'
import * as assert from 'node:assert/strict'
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
  const addListener = mock.fn(events.addEventListener)
  const removeListener = mock.fn(events.removeEventListener)

  global.BroadcastChannel = class BroadcastChannelMock {
    public name: string

    constructor(name: string) {
      this.name = name
    }

    addEventListener(name: string, listener: EventListener) {
      return addListener(name, listener)
    }

    removeEventListener(name: string, listener: EventListener) {
      return removeListener(name, listener)
    }
  }

  try {
    const watch = mock.fn()

    const $test = createStore('')
    const desist = persist({
      store: $test,
      key: 'test-desist',
      channel: 'test-desist',
      done: createEffect<any, any>(watch),
      fail: createEffect<any, any>(watch),
    })

    assert.strictEqual(addListener.mock.callCount(), 2)
    assert.strictEqual(addListener.mock.calls[0].arguments[0], 'message')
    assert.strictEqual(addListener.mock.calls[1].arguments[0], 'messageerror')

    const messageListener = addListener.mock.calls[0].arguments[1]
    const messageerrorListener = addListener.mock.calls[1].arguments[1]

    assert.strictEqual(watch.mock.callCount(), 1) // <- initial get call

    // stop persisting
    desist()

    assert.strictEqual(addListener.mock.callCount(), 2) // <- not changed
    assert.strictEqual(removeListener.mock.callCount(), 2)
    assert.strictEqual(removeListener.mock.calls[0].arguments[0], 'message')
    assert.strictEqual(
      removeListener.mock.calls[1].arguments[0],
      'messageerror'
    )

    assert.strictEqual(addListener.mock.calls[0].arguments[1], messageListener)
    assert.strictEqual(
      addListener.mock.calls[1].arguments[1],
      messageerrorListener
    )

    await events.dispatchEvent('message', { data: null })
    assert.strictEqual(watch.mock.callCount(), 1) // <- not changed

    await events.dispatchEvent('messageerror', { data: null })
    assert.strictEqual(watch.mock.callCount(), 1) // <- not changed
  } finally {
    global.BroadcastChannel = _BroadcastChannel
  }
})
