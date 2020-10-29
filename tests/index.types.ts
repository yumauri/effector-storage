import { test } from 'uvu'
import { expectType } from 'tsd'
import { Event, Store, Subscription } from 'effector'
import { StorageAdapter } from '../src'

//
// Tests
//

test('General `tie` should handle wrong arguments', async () => {
  const { tie } = await import('../src')

  const fakeAdapter: StorageAdapter = 0 as any
  const store: Store<number> = 0 as any

  // @ts-expect-error should fail on wrong arguments
  tie()

  // @ts-expect-error should fail on wrong arguments
  tie({})

  // @ts-expect-error should fail on wrong arguments
  tie({ with: fakeAdapter })

  // @ts-expect-error should fail on wrong arguments
  tie({ with: fakeAdapter, source: store })

  // @ts-expect-error should fail on wrong arguments
  tie({ with: fakeAdapter, target: store })
})

test('General `tie` should return Subscription', async () => {
  const { tie } = await import('../src')

  const fakeAdapter: StorageAdapter = 0 as any
  const store: Store<number> = 0 as any
  const ev1: Event<number> = 0 as any
  const ev2: Event<number> = 0 as any
  const handler: Event<any> = 0 as any
  const key = ''

  expectType<Subscription>(tie({ with: fakeAdapter, store }))
  expectType<Subscription>(tie({ with: fakeAdapter, store, key }))
  expectType<Subscription>(tie({ with: fakeAdapter, store, fail: handler }))
  expectType<Subscription>(tie({ with: fakeAdapter, store, key, fail: handler }))
  expectType<Subscription>(tie({ with: fakeAdapter, source: store, target: store }))
  expectType<Subscription>(tie({ with: fakeAdapter, source: store, target: store, key }))
  expectType<Subscription>(tie({ with: fakeAdapter, source: store, target: store, fail: handler }))
  expectType<Subscription>(
    tie({ with: fakeAdapter, source: store, target: store, key, fail: handler })
  )
  expectType<Subscription>(tie({ with: fakeAdapter, source: ev1, target: ev2 }))
  expectType<Subscription>(tie({ with: fakeAdapter, source: ev1, target: ev2, key }))
  expectType<Subscription>(tie({ with: fakeAdapter, source: ev1, target: ev2, fail: handler }))
  expectType<Subscription>(tie({ with: fakeAdapter, source: ev1, target: ev2, key, fail: handler }))
})

test('Partially applied `tie` should return Function', async () => {
  const { tie } = await import('../src/fp')

  const fakeAdapter: StorageAdapter = 0 as any
  const store: Store<number> = 0 as any
  const handler: Event<any> = 0 as any
  const key = ''

  expectType<<State>(store: Store<State>) => Store<State>>(tie({ with: fakeAdapter }))
  expectType<<State>(store: Store<State>) => Store<State>>(tie({ with: fakeAdapter, key }))
  expectType<<State>(store: Store<State>) => Store<State>>(
    tie({ with: fakeAdapter, fail: handler })
  )
  expectType<<State>(store: Store<State>) => Store<State>>(
    tie({ with: fakeAdapter, key, fail: handler })
  )
  expectType<Store<number>>(tie({ with: fakeAdapter })(store))
  expectType<Store<number>>(tie({ with: fakeAdapter, key })(store))
  expectType<Store<number>>(tie({ with: fakeAdapter, fail: handler })(store))
  expectType<Store<number>>(tie({ with: fakeAdapter, key, fail: handler })(store))
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
  expectType<Subscription>(persist({ source: store, target: store, fail: handler }))
  expectType<Subscription>(persist({ source: store, target: store, key, fail: handler }))
  expectType<Subscription>(persist({ source: ev1, target: ev2 }))
  expectType<Subscription>(persist({ source: ev1, target: ev2, key }))
  expectType<Subscription>(persist({ source: ev1, target: ev2, fail: handler }))
  expectType<Subscription>(persist({ source: ev1, target: ev2, key, fail: handler }))
})

test('Local fp `persist` should return Function', async () => {
  const { persist } = await import('../src/local/fp')

  const store: Store<number> = 0 as any
  const handler: Event<any> = 0 as any
  const key = ''

  expectType<<State>(store: Store<State>) => Store<State>>(persist())
  expectType<<State>(store: Store<State>) => Store<State>>(persist({}))
  expectType<<State>(store: Store<State>) => Store<State>>(persist({ key }))
  expectType<<State>(store: Store<State>) => Store<State>>(persist({ fail: handler }))
  expectType<<State>(store: Store<State>) => Store<State>>(persist({ key, fail: handler }))
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
  expectType<Subscription>(persist({ source: store, target: store, fail: handler }))
  expectType<Subscription>(persist({ source: store, target: store, key, fail: handler }))
  expectType<Subscription>(persist({ source: ev1, target: ev2 }))
  expectType<Subscription>(persist({ source: ev1, target: ev2, key }))
  expectType<Subscription>(persist({ source: ev1, target: ev2, fail: handler }))
  expectType<Subscription>(persist({ source: ev1, target: ev2, key, fail: handler }))
})

test('Session fp `persist` should return Function', async () => {
  const { persist } = await import('../src/session/fp')

  const store: Store<number> = 0 as any
  const handler: Event<any> = 0 as any
  const key = ''

  expectType<<State>(store: Store<State>) => Store<State>>(persist())
  expectType<<State>(store: Store<State>) => Store<State>>(persist({}))
  expectType<<State>(store: Store<State>) => Store<State>>(persist({ key }))
  expectType<<State>(store: Store<State>) => Store<State>>(persist({ fail: handler }))
  expectType<<State>(store: Store<State>) => Store<State>>(persist({ key, fail: handler }))
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
