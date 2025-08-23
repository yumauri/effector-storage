import type { StorageAdapter } from '../types'

export interface BroadcastConfig {
  channel?: string
}

/**
 * BroadcastChannel instances cache
 */
const channels = new Map<string, BroadcastChannel>()

/**
 * BroadcastChannel adapter factory
 */
export const adapter = ({
  channel = 'effector-storage',
}: BroadcastConfig): StorageAdapter => {
  let created: BroadcastChannel | undefined
  const bus = channels.get(channel) ?? (created = new BroadcastChannel(channel))
  if (created) channels.set(channel, created)

  const adapter: StorageAdapter = <State>(
    key: string,
    update: (raw?: any) => void
  ) => {
    const onmessage = ({ data }: MessageEvent) => {
      // according to e2e tests, chromium can call `message`
      // instead of `messageerror`, with `null` as message's data
      if (data == null) {
        update(() => {
          throw new Error('Unable to deserialize message')
        })
      } else if (data.key === key) {
        update(() => {
          return data.value
        })
      }
    }

    // I know only one case when this event can be fired:
    // if message was sent from page to shared worker, and it contains `SharedArrayBuffer`
    // https://bugs.webkit.org/show_bug.cgi?id=171216
    const onmessageerror = () => {
      update(() => {
        throw new Error('Unable to deserialize message')
      })
    }

    bus.addEventListener('message', onmessage)
    bus.addEventListener('messageerror', onmessageerror)

    const dispose = () => {
      bus.removeEventListener('message', onmessage)
      bus.removeEventListener('messageerror', onmessageerror)
    }

    return Object.assign(dispose, {
      get(box?: () => State | undefined) {
        if (box) return box()
      },

      set(value: State) {
        bus.postMessage({ key, value })
      },
    })
  }

  adapter.keyArea = bus
  return adapter
}
