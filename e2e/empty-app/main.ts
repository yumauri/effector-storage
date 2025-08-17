import * as effectorMod from 'effector'
import * as libMod from '../../src'

// biome-ignore lint/suspicious/noTsIgnore: there is no types for worker imports
// @ts-ignore
import MyWorker from './worker?worker'

// biome-ignore lint/suspicious/noTsIgnore: there is no types for worker imports
// @ts-ignore
import MySharedWorker from './sharedworker?sharedworker'

// expose all effector's exports in global variable `effector`
globalThis.effector = effectorMod

// expose all library's exports in global variable `lib`
globalThis.lib = libMod

// create broadcast channel for command messages
const channel = (globalThis.channel = new BroadcastChannel('command'))

globalThis.onMessage = (handler: (data: any) => void) => {
  channel.addEventListener('message', ({ data }) => {
    if (data == null || typeof data !== 'object' || data.dst !== 'tab') return
    if (data.type === 'hi' || data.type === 'eval' || data.type === 'result')
      return
    handler(data)
  })
}

// WebWorker factory
globalThis.createWorker = async () => {
  const worker = new MyWorker({ type: 'classic' })
  await new Promise<void>((resolve) => {
    channel.addEventListener('message', function handler({ data }) {
      if (data == null || typeof data !== 'object') return
      const { src, dst, type } = data
      if (src === 'worker' && dst === 'tab' && type === 'hi') {
        channel.removeEventListener('message', handler)
        resolve()
      }
    })
  })
  return worker
}

// SharedWorker factory
globalThis.createSharedWorker = async () => {
  const worker = new MySharedWorker({ type: 'classic' })
  await new Promise<void>((resolve) => {
    channel.addEventListener('message', function handler({ data }) {
      if (data == null || typeof data !== 'object') return
      const { src, dst, type } = data
      if (src === 'sharedworker' && dst === 'tab' && type === 'hi') {
        channel.removeEventListener('message', handler)
        resolve()
      }
    })
  })
  return worker
}

// eval code in WebWorker
globalThis.evalWorker = async (code: string) => {
  const result = await new Promise((resolve) => {
    channel.addEventListener('message', function handler({ data }) {
      if (data == null || typeof data !== 'object') return
      const { src, dst, type, payload, error } = data
      if (src === 'worker' && dst === 'tab' && type === 'result') {
        channel.removeEventListener('message', handler)
        resolve({ payload, error })
      }
    })
    channel.postMessage({
      src: 'tab',
      dst: 'worker',
      type: 'eval',
      payload: code,
    })
  })
  return result
}

// eval code in SharedWorker
globalThis.evalSharedWorker = async (code: string) => {
  const result = await new Promise((resolve) => {
    channel.addEventListener('message', function handler({ data }) {
      if (data == null || typeof data !== 'object') return
      const { src, dst, type, payload, error } = data
      if (src === 'sharedworker' && dst === 'tab' && type === 'result') {
        channel.removeEventListener('message', handler)
        resolve({ payload, error })
      }
    })
    channel.postMessage({
      src: 'tab',
      dst: 'sharedworker',
      type: 'eval',
      payload: code,
    })
  })
  return result
}
