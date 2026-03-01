import { it, vi, expect } from 'vitest'
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

it('should stop react on `message` and `messageerror` after desist', async () => {
  const _BroadcastChannel = global.BroadcastChannel
  const events = createEventsMock()
  const addListener = vi.fn(events.addEventListener)
  const removeListener = vi.fn(events.removeEventListener)

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
    const watch = vi.fn()

    const $test = createStore('')
    const desist = persist({
      store: $test,
      key: 'test-desist',
      channel: 'test-desist',
      done: createEffect(watch),
      fail: createEffect(watch),
    })

    expect(addListener).toHaveBeenCalledTimes(2)
    expect(addListener.mock.calls[0][0]).toBe('message')
    expect(addListener.mock.calls[1][0]).toBe('messageerror')

    const messageListener = addListener.mock.calls[0][1]
    const messageerrorListener = addListener.mock.calls[1][1]

    expect(watch).toHaveBeenCalledTimes(1) // <- initial get call

    // stop persisting
    desist()

    expect(addListener).toHaveBeenCalledTimes(2) // <- not changed
    expect(removeListener).toHaveBeenCalledTimes(2)
    expect(removeListener.mock.calls[0][0]).toBe('message')
    expect(removeListener.mock.calls[1][0]).toBe('messageerror')

    expect(addListener.mock.calls[0][1]).toBe(messageListener)
    expect(addListener.mock.calls[1][1]).toBe(messageerrorListener)

    await events.dispatchEvent('message', { data: null })
    expect(watch).toHaveBeenCalledTimes(1) // <- not changed

    await events.dispatchEvent('messageerror', { data: null })
    expect(watch).toHaveBeenCalledTimes(1) // <- not changed
  } finally {
    global.BroadcastChannel = _BroadcastChannel
  }
})
