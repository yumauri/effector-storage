type HistoryItem = {
  data: any
  title: string
  url?: string | null
}

export function createHistoryMock(
  data: any,
  title: string,
  url?: string | null
): History {
  const history = Object.create(null)
  let location: Location & { _set: (url: string) => void }

  const items: HistoryItem[] = [{ data, title, url }]
  let index = 0

  const noop: any = () => undefined
  let backCallback: History['back'] = noop
  let forwardCallback: History['forward'] = noop
  let goCallback: History['go'] = noop
  let pushStateCallback: History['pushState'] = noop
  let replaceStateCallback: History['replaceState'] = noop

  Object.defineProperty(history, 'length', {
    get() {
      return items.length
    },
  })

  Object.defineProperty(history, 'state', {
    get() {
      return items[index].data
    },
  })

  Object.defineProperty(history, 'back', {
    value() {
      backCallback()
      if (index > 0) {
        index -= 1
        if (location && items[index].url != null) {
          location._set(items[index].url as string)
        }
      }
    },
  })

  Object.defineProperty(history, 'forward', {
    value() {
      forwardCallback()
      if (index < items.length - 1) {
        index += 1
        if (location && items[index].url != null) {
          location._set(items[index].url as string)
        }
      }
    },
  })

  Object.defineProperty(history, 'go', {
    value(delta?: number) {
      goCallback(delta)
      const idx = index + (delta || 0)
      if (idx >= 0 && idx <= items.length - 1) {
        index = idx
        if (location && items[index].url != null) {
          location._set(items[index].url as string)
        }
      }
    },
  })

  Object.defineProperty(history, 'pushState', {
    value(data: any, title: string, url?: string | null) {
      pushStateCallback(data, title, url)
      items.push({ data, title, url })
      index = items.length - 1
      if (location && items[index].url != null) {
        location._set(items[index].url as string)
      }
    },
  })

  Object.defineProperty(history, 'replaceState', {
    value(data: any, title: string, url?: string | null) {
      replaceStateCallback(data, title, url)
      items[items.length - 1] = { data, title, url }
      index = items.length - 1
      if (location && items[index].url != null) {
        location._set(items[index].url as string)
      }
    },
  })

  Object.defineProperty(history, '_callbacks', {
    value({ back, forward, go, pushState, replaceState }: Partial<History>) {
      backCallback = back || noop
      forwardCallback = forward || noop
      goCallback = go || noop
      pushStateCallback = pushState || noop
      replaceStateCallback = replaceState || noop
    },
  })

  Object.defineProperty(history, '_location', {
    value(l: Location & { _set: (url: string) => void }) {
      location = l
    },
  })

  Object.defineProperty(history, '_push', {
    value(url: string) {
      items.push({ data: null, title: '', url })
      index = items.length - 1
    },
  })

  Object.defineProperty(history, '_replace', {
    value(url: string) {
      items[items.length - 1] = { data: null, title: '', url }
      index = items.length - 1
    },
  })

  return history
}
