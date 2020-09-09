import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { createStore } from 'effector'
import { tie, StorageAdapter } from '../src'

//
// Config test adapter
//

interface GreetAdapterConfig {
  key: string
  first?: string
  last?: string
}

const greetAdapter: StorageAdapter<GreetAdapterConfig> = <State>(
  _defaultValue: State,
  config: GreetAdapterConfig
) => ({
  get: () => `${config.first} ${config.last}` as any,
  set: () => undefined,
})

//
// Tests
//

test('should pass config options to adapter', async () => {
  const createConfigStore = tie(createStore, { with: greetAdapter, first: 'Hello' })
  const store1$ = createConfigStore('', { key: 'test', last: 'world' })
  const store2$ = createConfigStore('', { key: 'test', last: 'you' })
  const store3$ = createConfigStore('', { key: 'test', first: 'Goodbye', last: 'world' })
  assert.is(store1$.getState(), 'Hello world')
  assert.is(store2$.getState(), 'Hello you')
  assert.is(store3$.getState(), 'Goodbye world')
})

test.run()
