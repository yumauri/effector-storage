import type { StorageAdapter } from '../src/types'
import type {
  EventCallable,
  Store,
  StoreWritable,
  Subscription,
} from 'effector'
import { it } from 'vitest'
import { createStore, createEvent } from 'effector'

function expectType<T>(_value: T): void {}

//
// Tests
//

it('General `persist` should handle wrong arguments', async () => {
  const { persist } = await import('../src')

  const fakeAdapter: StorageAdapter = 0 as any
  const store: Store<number> = 0 as any

  // @ts-expect-error should fail on wrong arguments
  persist()

  // @ts-expect-error should fail on wrong arguments
  persist({})

  // @ts-expect-error should fail on wrong arguments
  persist({ adapter: fakeAdapter })

  // @ts-expect-error should fail on wrong arguments
  persist({ adapter: fakeAdapter, source: store })

  // @ts-expect-error should fail on wrong arguments
  persist({ adapter: fakeAdapter, target: store })
})

it('General `persist` should return Subscription', async () => {
  const { persist } = await import('../src')

  const fakeAdapter: StorageAdapter = 0 as any
  const store: StoreWritable<number> = 0 as any
  const ev1: EventCallable<number> = 0 as any
  const ev2: EventCallable<number> = 0 as any
  const handler: EventCallable<any> = 0 as any
  const key = ''

  expectType<Subscription>(persist({ adapter: fakeAdapter, store }))
  expectType<Subscription>(persist({ adapter: fakeAdapter, store, key }))
  expectType<Subscription>(
    persist({ adapter: fakeAdapter, store, fail: handler })
  )
  expectType<Subscription>(
    persist({ adapter: fakeAdapter, store, key, fail: handler })
  )
  expectType<Subscription>(
    persist({ adapter: fakeAdapter, source: store, target: store })
  )
  expectType<Subscription>(
    persist({ adapter: fakeAdapter, source: store, target: store, key })
  )
  expectType<Subscription>(
    persist({
      adapter: fakeAdapter,
      source: store,
      target: store,
      fail: handler,
    })
  )
  expectType<Subscription>(
    persist({
      adapter: fakeAdapter,
      source: store,
      target: store,
      key,
      fail: handler,
    })
  )
  expectType<Subscription>(
    persist({ adapter: fakeAdapter, source: ev1, target: ev2 })
  )
  expectType<Subscription>(
    persist({ adapter: fakeAdapter, source: ev1, target: ev2, key })
  )
  expectType<Subscription>(
    persist({ adapter: fakeAdapter, source: ev1, target: ev2, fail: handler })
  )
  expectType<Subscription>(
    persist({
      adapter: fakeAdapter,
      source: ev1,
      target: ev2,
      key,
      fail: handler,
    })
  )
})

it('Local `persist` should return Subscription', async () => {
  const { persist } = await import('../src/local')

  const store: StoreWritable<number> = 0 as any
  const ev1: EventCallable<number> = 0 as any
  const ev2: EventCallable<number> = 0 as any
  const handler: EventCallable<any> = 0 as any
  const key = ''
  const keyPrefix = ''

  expectType<Subscription>(persist({ store }))
  expectType<Subscription>(persist({ store, key }))
  expectType<Subscription>(persist({ store, keyPrefix }))
  expectType<Subscription>(persist({ store, fail: handler }))
  expectType<Subscription>(persist({ store, key, fail: handler }))
  expectType<Subscription>(persist({ source: store, target: store }))
  expectType<Subscription>(persist({ source: store, target: store, key }))
  expectType<Subscription>(
    persist({ source: store, target: store, fail: handler })
  )
  expectType<Subscription>(
    persist({ source: store, target: store, key, fail: handler })
  )
  expectType<Subscription>(persist({ source: ev1, target: ev2 }))
  expectType<Subscription>(persist({ source: ev1, target: ev2, key }))
  expectType<Subscription>(persist({ source: ev1, target: ev2, fail: handler }))
  expectType<Subscription>(
    persist({ source: ev1, target: ev2, key, fail: handler })
  )
})

it('Session `persist` should return Subscription', async () => {
  const { persist } = await import('../src/session')

  const store: StoreWritable<number> = 0 as any
  const ev1: EventCallable<number> = 0 as any
  const ev2: EventCallable<number> = 0 as any
  const handler: EventCallable<any> = 0 as any
  const key = ''

  expectType<Subscription>(persist({ store }))
  expectType<Subscription>(persist({ store, key }))
  expectType<Subscription>(persist({ store, fail: handler }))
  expectType<Subscription>(persist({ store, key, fail: handler }))
  expectType<Subscription>(persist({ source: store, target: store }))
  expectType<Subscription>(persist({ source: store, target: store, key }))
  expectType<Subscription>(
    persist({ source: store, target: store, fail: handler })
  )
  expectType<Subscription>(
    persist({ source: store, target: store, key, fail: handler })
  )
  expectType<Subscription>(persist({ source: ev1, target: ev2 }))
  expectType<Subscription>(persist({ source: ev1, target: ev2, key }))
  expectType<Subscription>(persist({ source: ev1, target: ev2, fail: handler }))
  expectType<Subscription>(
    persist({ source: ev1, target: ev2, key, fail: handler })
  )
})

it("Should be possible to pass adapter's arguments in core persist with adapter factory", async () => {
  const { persist, local } = await import('../src')

  const store: StoreWritable<number> = 0 as any

  expectType<Subscription>(persist({ store, adapter: local() }))
  expectType<Subscription>(persist({ store, adapter: local }))
  expectType<Subscription>(
    persist({
      store,
      adapter: local,
      sync: false,
      serialize: (value: number) => String(value),
      deserialize: (value: string) => Number(value),
      def: 42,
    })
  )
})

it('Should not accept any arbitrary argument in core persist with adapter factory', async () => {
  const { persist, local } = await import('../src')

  const store: Store<number> = 0 as any

  // @ts-expect-error should fail on wrong arguments
  persist({ store, adapter: local, blablabla: 0 })
})

it('Should accept targetables', async () => {
  const { persist } = await import('../src/local')
  const store = createStore(0)
  const source1 = createEvent()
  const source2 = source1.map((_) => _)
  const target = createEvent()
  persist({ store })
  persist({ source: source1, target })
  persist({ source: source2, target })
})

it('Should not accept non targetables', async () => {
  const { persist } = await import('../src/local')
  const store = createStore(0).map((_) => _)
  const source = createEvent()
  const target = createEvent().map((_) => _)

  /* @ts-expect-error */
  persist({ store })

  /* @ts-expect-error */
  persist({ source, target })
})
