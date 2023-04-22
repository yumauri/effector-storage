type HistoryItem = {
  data: any
  title: string
  url?: string | null
}

const noop: any = () => undefined

export class HistoryMock implements History {
  private location?: Location & { _set: (url: string) => void }

  private items: HistoryItem[]
  private index: number

  private backCallback: History['back'] = noop
  private forwardCallback: History['forward'] = noop
  private goCallback: History['go'] = noop
  private pushStateCallback: History['pushState'] = noop
  private replaceStateCallback: History['replaceState'] = noop

  constructor(data: any, title: string, url?: string | null) {
    this.items = [{ data, title, url }]
    this.index = 0
  }

  public scrollRestoration: ScrollRestoration = 'auto'

  public get length() {
    return this.items.length
  }

  public get state() {
    return this.items[this.index].data
  }

  private updateLocation() {
    if (this.location && this.items[this.index].url != null) {
      this.location._set(this.items[this.index].url as string)
    }
  }

  public back() {
    this.backCallback()
    if (this.index > 0) {
      this.index -= 1
      this.updateLocation()
    }
  }

  public forward() {
    this.forwardCallback()
    if (this.index < this.items.length - 1) {
      this.index += 1
      this.updateLocation()
    }
  }

  public go(delta?: number) {
    this.goCallback(delta)
    const idx = this.index + (delta || 0)
    if (idx >= 0 && idx <= this.items.length - 1) {
      this.index = idx
      this.updateLocation()
    }
  }

  public pushState(data: any, title: string, url?: string | null) {
    this.pushStateCallback(data, title, url)
    this.items.push({ data, title, url })
    this.index = this.items.length - 1
    this.updateLocation()
  }

  public replaceState(data: any, title: string, url?: string | null) {
    this.replaceStateCallback(data, title, url)
    this.items[this.items.length - 1] = { data, title, url }
    this.index = this.items.length - 1
    this.updateLocation()
  }

  public _callbacks({
    back,
    forward,
    go,
    pushState,
    replaceState,
  }: Partial<History>) {
    this.backCallback = back || noop
    this.forwardCallback = forward || noop
    this.goCallback = go || noop
    this.pushStateCallback = pushState || noop
    this.replaceStateCallback = replaceState || noop
  }

  public _location(l: Location & { _set: (url: string) => void }) {
    this.location = l
  }

  public _push(url: string) {
    this.items.push({ data: null, title: '', url })
    this.index = this.items.length - 1
  }

  public _replace(url: string) {
    this.items[this.items.length - 1] = { data: null, title: '', url }
    this.index = this.items.length - 1
  }
}

export function createHistoryMock(
  data: any,
  title: string,
  url?: string | null
): History {
  return new HistoryMock(data, title, url)
}
