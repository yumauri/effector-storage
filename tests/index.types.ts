import { test } from 'uvu'
import { expectType } from 'tsd'
import { createStore } from 'effector'
import { Tie, StorageAdapter, StorageStore, TiedStoreCreator } from '../src'

// prettier-ignore
test('<Tie> interface should be curried', () => {
  const tie: Tie = (() => tie) as any
  const localStorage: StorageAdapter = 0 as any
  const testAdapter: StorageAdapter<{ test: number }> = 0 as any

  // (store):
  // AdapterConfig <unknown>, store <number>, fields <'store'>
  expectType<
    Tie<unknown, number, 'store'>
  >(
    tie(createStore(0))
  )

  // (void adapter):
  // AdapterConfig <void>, store <unknown>, fields <'with'>
  expectType<
    Tie<void, unknown, 'with'>
  >(
    tie({ with: localStorage })
  )

  // (adapter with config):
  // AdapterConfig <{ test: number }>, store <unknown>, fields <'with'>
  expectType<
    Tie<{ test: number }, unknown, 'with'>
  >(
    tie({ with: testAdapter })
  )

  // (void adapter, key):
  // AdapterConfig <void>, store <unknown>, fields <'with' | 'key'>
  expectType<
    Tie<void, unknown, 'with' | 'key'>
  >(
    tie({ with: localStorage, key: 'key' })
  )

  // (void adapter)(key):
  // AdapterConfig <void>, store <unknown>, fields <'with' | 'key'>
  expectType<
    Tie<void, unknown, 'with' | 'key'>
  >(
    tie({ with: localStorage })({ key: 'key' })
  )

  // (adapter with config, key):
  // AdapterConfig <{ test: number }>, store <unknown>, fields <'with' | 'key'>
  expectType<
    Tie<{ test: number }, unknown, 'with' | 'key'>
  >(
    tie({ with: testAdapter, key: 'key' })
  )

  // (adapter with config)(key):
  // AdapterConfig <{ test: number }>, store <unknown>, fields <'with' | 'key'>
  expectType<
    Tie<{ test: number }, unknown, 'with' | 'key'>
  >(
    tie({ with: testAdapter })({ key: 'key' })
  )

  // (store)(void adapter)
  // AdapterConfig <void>, store <number>, fields <'store' | 'with'>
  expectType<
    Tie<void, number, 'store' | 'with'>
  >(
    tie(createStore(0))({ with: localStorage })
  )

  // (store)(adapter with config)
  // AdapterConfig <{ test: number }>, store <number>, fields <'store' | 'with'>
  expectType<
    Tie<{ test: number }, number, 'store' | 'with'>
  >(
    tie(createStore(0))({ with: testAdapter })
  )

  // (store)(void adapter, optional key)
  // AdapterConfig <void>, store <number>, fields <'store' | 'with' | 'x'>
  expectType<
    Tie<void, number, 'store' | 'with' | 'x'>
  >(
    tie(createStore(0))({ with: localStorage, x: 1 })
  )

  // (void adapter)(store)
  // AdapterConfig <void>, store <number>, fields <'with' | 'store'>
  expectType<
    Tie<void, number, 'with' | 'store'>
  >(
    tie({ with: localStorage })(createStore(0))
  )

  // (adapter with config)(store)
  // AdapterConfig <{ test: number }>, store <number>, fields <'with' | 'store'>
  expectType<
    Tie<{ test: number }, number, 'with' | 'store'>
  >(
    tie({ with: testAdapter })(createStore(0))
  )

  // (empty)
  // AdapterConfig <unknown>, store <unknown>, fields <never>
  expectType<
    Tie<unknown, unknown, never>
  >(
    tie({})
  )

  // (empty)(store)
  // AdapterConfig <unknown>, store <number>, fields <'store'>
  expectType<
    Tie<unknown, number, 'store'>
  >(
    tie({})(createStore(0))
  )

  // (void adapter)(key)(adapter with config):
  // AdapterConfig <{ test: number }>, store <unknown>, fields <'with' | 'key'>
  expectType<
    Tie<{ test: number }, unknown, 'with' | 'key'>
  >(
    tie({ with: localStorage })({ key: 'key' })({ with: testAdapter })
  )

  // --- ignore key from adapter config --- //
  // I decided to drop support of this feature in favor of library size

  // (store)(adapter with config, key)
  // AdapterConfig <{ test: number }>, store <number>, fields <'store' | 'with' | 'key'>
  expectType<
    Tie<{ test: number }, number, 'store' | 'with' | 'key'>
  >(
    // @ts-expect-error returns StorageStore<number>
    tie(createStore(0))({ with: testAdapter, key: 'key' })
  )

  // (store)(adapter with config)(key)
  // AdapterConfig <{ test: number }>, store <number>, fields <'store' | 'with' | 'key'>
  expectType<
    Tie<{ test: number }, number, 'store' | 'with' | 'key'>
  >(
    // @ts-expect-error returns StorageStore<number>
    tie(createStore(0))({ with: testAdapter })({ key: 'key' })
  )

  // (adapter with config, store, key)
  // AdapterConfig <{ test: number }>, store <number>, fields <'with' | 'store' | 'key'>
  expectType<
    Tie<{ test: number }, number, 'with' | 'store' | 'key'>
  >(
    // @ts-expect-error returns StorageStore<number>
    tie({ with: testAdapter, store: createStore(0), key: 'key' })
  )
})

// prettier-ignore
test('<Tie> interface should return StorageStore', () => {
  const tie: Tie = (() => tie) as any
  const localStorage: StorageAdapter = 0 as any
  const testAdapter: StorageAdapter<{ test: number }> = 0 as any

  // (void adapter, store, key)
  // StorageStore<number>
  expectType<
    StorageStore<number>
  >(
    tie({ with: localStorage, store: createStore(0), key: 'key' })
  )

  // (void adapter, key)(store)
  // StorageStore<number>
  expectType<
    StorageStore<number>
  >(
    tie({ with: localStorage, key: 'key' })(createStore(0))
  )

  // (void adapter)(key)(store)
  // StorageStore<number>
  expectType<
    StorageStore<number>
  >(
    tie({ with: localStorage })({ key: 'key' })({ store: createStore(0) })
  )

  // (store)(void adapter)(key)
  // StorageStore<number>
  expectType<
    StorageStore<number>
  >(
    tie(createStore(0))({ with: localStorage })({ key: 'key' })
  )

  // (store)(void adapter, key)
  // StorageStore<number>
  expectType<
    StorageStore<number>
  >(
    tie(createStore(0))({ with: localStorage, key: 'key' })
  )

  // (store)(adapter with config, key, required key)
  // StorageStore<number>
  expectType<
    StorageStore<number>
  >(
    tie(createStore(0))({ with: testAdapter, key: 'key', test: 0 })
  )

  // (store)(adapter with config, required key)(key)
  // StorageStore<number>
  expectType<
    StorageStore<number>
  >(
    tie(createStore(0))({ with: testAdapter, test: 0 })({ key: 'key' })
  )

  // (adapter with config, required key, store, key)
  // StorageStore<number>
  expectType<
    StorageStore<number>
  >(
    tie({ with: testAdapter, test: 0, store: createStore(0), key: 'key' })
  )
})

// prettier-ignore
test('<Tie> interface should return TiedStoreCreator', () => {
  const tie: Tie = (() => tie) as any
  const localStorage: StorageAdapter = 0 as any
  const testAdapter: StorageAdapter<{ test: number }> = 0 as any

  // (void adapter)(creator)
  // TiedStoreCreator<void>
  expectType<
    TiedStoreCreator<void>
  >(
    tie({ with: localStorage })(createStore)
  )

  // (adapter with config)(creator)
  // TiedStoreCreator<{ test: number }>
  expectType<
    TiedStoreCreator<{ test: number }>
  >(
    tie({ with: testAdapter })(createStore)
  )

  // (adapter with config, required field)(creator)
  // TiedStoreCreator<void>
  expectType<
    TiedStoreCreator<void>
  >(
    tie({ with: testAdapter, test: 'test' })(createStore)
  )

  // tsd cannot catch <never>, so use this ad hoc solution
  const expectNever = (_: never) => undefined // eslint-disable-line @typescript-eslint/no-unused-vars

  // (creator)
  // never
  expectNever(
    tie(createStore)
  )

  // (empty config)(creator)
  // never
  expectNever(
    tie({})(createStore)
  )

  // (config without adapter)(creator)
  // never
  expectNever(
    tie({ key: 'key' })(createStore)
  )

  // (config without adapter)(creator)
  // never
  expectNever(
    // @ts-expect-error Argument of type 'TiedStoreCreator<void>' is not assignable to parameter of type 'never'
    tie({ key: 'key', with: localStorage })(createStore)
  )
})

test.run()
