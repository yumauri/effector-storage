import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { createStore } from 'effector'
import { tie, StorageAdapter } from '../src'

//
// Config test adapter
//

interface ConfigAdapterConfig {
  key: string
  set?: number
  multiply?: number
}

const configAdapter: StorageAdapter<ConfigAdapterConfig> = <State>(
  _defaultValue: State,
  config: ConfigAdapterConfig
) => () => (config.set! * config.multiply!) as any // eslint-disable-line @typescript-eslint/no-non-null-assertion

//
// Tests
//

test('should pass config options to adapter', async () => {
  const createConfigStore = tie(createStore, { with: configAdapter, set: 100 })
  const store1$ = createConfigStore(0, { key: 'test', multiply: 2.5 })
  const store2$ = createConfigStore(0, { key: 'test', multiply: 5 })
  assert.is(store1$.getState(), 250)
  assert.is(store2$.getState(), 500)
})

test.run()
