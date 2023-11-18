import type { StorageAdapter } from '../types'

export type ChangeMethod = (
  params: URLSearchParams | string,
  erase?: boolean
) => void

export type StateBehavior = 'keep' | 'erase'

export interface QueryConfig {
  method?: ChangeMethod
  state?: StateBehavior
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
  timeout?: number
  def?: any
}

const keyArea = Symbol() // eslint-disable-line symbol-description

const buffer = new Map<string, any>()
let timeoutId: ReturnType<typeof setTimeout> | undefined
let scheduled: number | undefined

/*
 * Location change methods list
 */

const url = (params: URLSearchParams | string) =>
  location.pathname +
  (params + '' ? '?' + params : '') +
  (location.hash && location.hash !== '#' ? location.hash : '')

export const pushState: ChangeMethod = (params, erase): void =>
  history.pushState(erase ? null : history.state, '', url(params))

export const replaceState: ChangeMethod = (params, erase): void =>
  history.replaceState(erase ? null : history.state, '', url(params))

export const locationAssign: ChangeMethod = (params): void =>
  location.assign(url(params))

export const locationReplace: ChangeMethod = (params): void =>
  location.replace(url(params))

/**
 * Flush buffer to actual location search params
 */
function flush(method: ChangeMethod, state?: StateBehavior) {
  scheduled = undefined
  if (buffer.size) {
    const params = new URLSearchParams(location.search)
    for (const [name, value] of buffer.entries()) {
      if (value != null) {
        params.set(name, `${value}`)
      } else {
        params.delete(name)
      }
    }
    buffer.clear()
    method(params, state === 'erase')
  }
}

/**
 * Query string adapter factory
 */
export function adapter({
  method = pushState,
  state,
  serialize,
  deserialize,
  def = null,
  timeout,
}: QueryConfig): StorageAdapter {
  const adapter: StorageAdapter = <State>(
    key: string,
    update: (raw?: any) => void
  ) => {
    if (typeof addEventListener !== 'undefined') {
      addEventListener('popstate', () => setTimeout(update, 0))
    }

    return {
      get() {
        const params = new URLSearchParams(location.search)
        const value = params.get(key)
        return value ? (deserialize ? deserialize(value) : value) : def
      },

      set(value: State) {
        buffer.set(key, serialize ? serialize(value) : value)

        if (timeout === undefined) {
          clearTimeout(timeoutId)
          return flush(method, state)
        }

        const deadline = Date.now() + timeout
        if (scheduled === undefined || scheduled > deadline) {
          clearTimeout(timeoutId)
          scheduled = deadline
          timeoutId = setTimeout(flush, timeout, method, state)
        }
      },
    }
  }

  adapter.keyArea = keyArea
  return adapter
}
