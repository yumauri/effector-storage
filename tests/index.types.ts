import { test } from 'uvu'
import { expectType } from 'tsd'
import { Event, Store, Subscription } from 'effector'
import { StorageAdapter } from '../src'

//
// Tests
//

test('General `persist` should handle wrong arguments', async () => {
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

test('General `persist` should return Subscription', async () => {
  const { persist } = await import('../src')

  const fakeAdapter: StorageAdapter = 0 as any
  const store: Store<number> = 0 as any
  const ev1: Event<number> = 0 as any
  const ev2: Event<number> = 0 as any
  const handler: Event<any> = 0 as any
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

test('Partially applied `persist` should return Function', async () => {
  const { persist } = await import('../src/fp')

  const fakeAdapter: StorageAdapter = 0 as any
  const store: Store<number> = 0 as any
  const handler: Event<any> = 0 as any
  const key = ''

  expectType<<State>(store: Store<State>) => Store<State>>(
    persist({ adapter: fakeAdapter })
  )
  expectType<<State>(store: Store<State>) => Store<State>>(
    persist({ adapter: fakeAdapter, key })
  )
  expectType<<State>(store: Store<State>) => Store<State>>(
    persist({ adapter: fakeAdapter, fail: handler })
  )
  expectType<<State>(store: Store<State>) => Store<State>>(
    persist({ adapter: fakeAdapter, key, fail: handler })
  )
  expectType<Store<number>>(persist({ adapter: fakeAdapter })(store))
  expectType<Store<number>>(persist({ adapter: fakeAdapter, key })(store))
  expectType<Store<number>>(
    persist({ adapter: fakeAdapter, fail: handler })(store)
  )
  expectType<Store<number>>(
    persist({ adapter: fakeAdapter, key, fail: handler })(store)
  )
})

test('Local `persist` should return Subscription', async () => {
  const { persist } = await import('../src/local')

  const store: Store<number> = 0 as any
  const ev1: Event<number> = 0 as any
  const ev2: Event<number> = 0 as any
  const handler: Event<any> = 0 as any
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

test('Local fp `persist` should return Function', async () => {
  const { persist } = await import('../src/local/fp')

  const store: Store<number> = 0 as any
  const handler: Event<any> = 0 as any
  const key = ''

  expectType<<State>(store: Store<State>) => Store<State>>(persist())
  expectType<<State>(store: Store<State>) => Store<State>>(persist({}))
  expectType<<State>(store: Store<State>) => Store<State>>(persist({ key }))
  expectType<<State>(store: Store<State>) => Store<State>>(
    persist({ fail: handler })
  )
  expectType<<State>(store: Store<State>) => Store<State>>(
    persist({ key, fail: handler })
  )
  expectType<Store<number>>(persist()(store))
  expectType<Store<number>>(persist({})(store))
  expectType<Store<number>>(persist({ key })(store))
  expectType<Store<number>>(persist({ fail: handler })(store))
  expectType<Store<number>>(persist({ key, fail: handler })(store))
})

test('Session `persist` should return Subscription', async () => {
  const { persist } = await import('../src/session')

  const store: Store<number> = 0 as any
  const ev1: Event<number> = 0 as any
  const ev2: Event<number> = 0 as any
  const handler: Event<any> = 0 as any
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

test('Session fp `persist` should return Function', async () => {
  const { persist } = await import('../src/session/fp')

  const store: Store<number> = 0 as any
  const handler: Event<any> = 0 as any
  const key = ''

  expectType<<State>(store: Store<State>) => Store<State>>(persist())
  expectType<<State>(store: Store<State>) => Store<State>>(persist({}))
  expectType<<State>(store: Store<State>) => Store<State>>(persist({ key }))
  expectType<<State>(store: Store<State>) => Store<State>>(
    persist({ fail: handler })
  )
  expectType<<State>(store: Store<State>) => Store<State>>(
    persist({ key, fail: handler })
  )
  expectType<Store<number>>(persist()(store))
  expectType<Store<number>>(persist({})(store))
  expectType<Store<number>>(persist({ key })(store))
  expectType<Store<number>>(persist({ fail: handler })(store))
  expectType<Store<number>>(persist({ key, fail: handler })(store))
})

//
// DO NOT launch tests, because they will fail in runtime
// TypeScript will do the job for us, by checking the syntax
//
