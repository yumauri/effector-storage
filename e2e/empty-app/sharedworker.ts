import * as effectorMod from 'effector'
import * as libMod from '../../src'

// expose all effector's exports in global variable `effector`
globalThis.effector = effectorMod

// expose all library's exports in global variable `lib`
globalThis.lib = libMod

// create broadcast channel for command messages
const channel = (globalThis.channel = new BroadcastChannel('command'))
const eval2 = eval // eslint-disable-line no-eval

channel.addEventListener('message', async function ({ data }) {
  if (data == null || typeof data !== 'object') return

  const { src, dst, type, payload } = data
  if (dst === 'sharedworker' && type === 'eval') {
    let result: any, error: any
    try {
      result = await Promise.resolve(eval2(payload))
    } catch (err) {
      error = err
    }
    channel.postMessage({
      src: 'sharedworker',
      dst: src,
      type: 'result',
      payload: result,
      error,
    })
  }
})

channel.postMessage({
  src: 'sharedworker',
  dst: 'tab',
  type: 'hi',
})
