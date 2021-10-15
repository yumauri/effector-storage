import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { createStore } from 'effector'
import { createStorageMock } from './mocks/storage.mock'
import { persist } from '../src/rn/async'

//
// Mock `localStorage`
// In the browser environment '@react-native-async-storage/async-storage'
// uses localStorage under the hood, so I mock it here.
// I'm not sure, how to mock '@react-native-async-storage/async-storage' module itself ???
//

declare let global: any

test.before(() => {
  global.localStorage = createStorageMock()
  global.window = {
    localStorage: global.localStorage,
  }
})

test.after(() => {
  delete global.localStorage
  delete global.window
})

//
// Tests
//

test('should export adapter and `persist` function', () => {
  assert.type(persist, 'function')
})

test('should be ok on good parameters', () => {
  const $store = createStore(0, { name: 'rn::async::store' })
  assert.not.throws(() => persist({ store: $store }))
})

//
// Launch tests
//

test.run()
