export function createLocationMock(url: string): Location {
  const location = Object.create(new URL(url))
  let history: History & {
    _push: (url: string) => void
    _replace: (url: string) => void
  }

  const noop: any = () => undefined
  let assignCallback: Location['assign'] = noop
  let reloadCallback: Location['reload'] = noop
  let replaceCallback: Location['replace'] = noop

  Object.defineProperty(location, 'assign', {
    value(url: string) {
      assignCallback(url)
      if (history) {
        history._push(url)
      }
      Object.setPrototypeOf(location, new URL(location.origin + url))
    },
  })

  Object.defineProperty(location, 'reload', {
    value() {
      reloadCallback()
    },
  })

  Object.defineProperty(location, 'replace', {
    value(url: string) {
      replaceCallback(url)
      if (history) {
        history._replace(url)
      }
      Object.setPrototypeOf(location, new URL(location.origin + url))
    },
  })

  Object.defineProperty(location, '_callbacks', {
    value({ assign, reload, replace }: Partial<Location>) {
      assignCallback = assign || noop
      reloadCallback = reload || noop
      replaceCallback = replace || noop
    },
  })

  Object.defineProperty(location, '_history', {
    value(
      h: History & {
        _push: (url: string) => void
        _replace: (url: string) => void
      }
    ) {
      history = h
    },
  })

  Object.defineProperty(location, '_set', {
    value(url: string) {
      Object.setPrototypeOf(location, new URL(location.origin + url))
    },
  })

  return location
}
