import * as effectorMod from 'effector'
import * as libMod from '../../src'

// expose all effector's exports in global variable `effector`
globalThis.effector = effectorMod

// expose all library's exports in global variable `lib`
globalThis.lib = libMod

// create broadcast channel for command messages
const channel = (globalThis.channel = new BroadcastChannel('command'))

// biome-ignore lint/security/noGlobalEval: this is an escape hatch for testing purposes
const eval2 = eval

channel.addEventListener('message', async ({ data }) => {
  if (data == null || typeof data !== 'object') return

  const { src, dst, type, payload } = data
  if (dst === 'worker' && type === 'eval') {
    let result: any
    let error: any
    try {
      result = await Promise.resolve(eval2(payload))
    } catch (err) {
      error = err
    }
    channel.postMessage({
      src: 'worker',
      dst: src,
      type: 'result',
      payload: result,
      error,
    })
  }
})

channel.postMessage({
  src: 'worker',
  dst: 'tab',
  type: 'hi',
})
