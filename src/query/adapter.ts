import type { StorageAdapter } from '..'

export type ChangeMethod = (
  params: URLSearchParams | string,
  erase?: boolean
) => void

export type StateBehavior = 'keep' | 'erase'

export interface QueryConfig {
  method?: ChangeMethod
  state?: StateBehavior
  def?: any
}

const keyArea = Symbol() // eslint-disable-line symbol-description

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
 * Query string adapter factory
 */
export function query({
  method = pushState,
  state,
  def = null,
}: QueryConfig): StorageAdapter {
  const adapter: StorageAdapter = <State>(
    key: string,
    update: (raw?: any) => any
  ) => {
    if (typeof addEventListener !== 'undefined') {
      addEventListener('popstate', () => setTimeout(update, 0))
    }

    return {
      get() {
        const params = new URLSearchParams(location.search)
        return params.get(key) || def
      },

      set(value: State) {
        const params = new URLSearchParams(location.search)
        if (value != null) {
          params.set(key, `${value}`)
        } else {
          params.delete(key)
        }
        method(params, state === 'erase')
      },
    }
  }

  adapter.keyArea = keyArea
  return adapter
}
