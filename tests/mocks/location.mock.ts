const noop: any = () => undefined

export class LocationMock extends URL implements Location {
  private history?: History & {
    _push: (url: string) => void
    _replace: (url: string) => void
  }

  private assignCallback: Location['assign'] = noop
  private reloadCallback: Location['reload'] = noop
  private replaceCallback: Location['replace'] = noop

  public ancestorOrigins = [] as any as DOMStringList

  public assign(url: string): void {
    this.assignCallback(url)
    if (this.history) {
      this.history._push(url)
    }
    this.href = this.origin + url
  }

  public reload(): void {
    this.reloadCallback()
  }

  public replace(url: string): void {
    this.replaceCallback(url)
    if (this.history) {
      this.history._replace(url)
    }
    this.href = this.origin + url
  }

  public _callbacks({ assign, reload, replace }: Partial<Location>): void {
    this.assignCallback = assign || noop
    this.reloadCallback = reload || noop
    this.replaceCallback = replace || noop
  }

  public _history(
    h: History & {
      _push: (url: string) => void
      _replace: (url: string) => void
    }
  ): void {
    this.history = h
  }

  public _set(url: string): void {
    this.href = this.origin + url
  }
}

export function createLocationMock(url: string): Location {
  return new LocationMock(url)
}
