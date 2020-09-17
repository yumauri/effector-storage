import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { createStorageMock } from './mocks/storage.mock'
import { createEventsMock } from './mocks/events.mock'

//
// Mock Storage adapter and events
//

declare let global: any

const events = createEventsMock()
global.addEventListener = events.addEventListener

const localStorageMock = createStorageMock()
global.window = {}
global.window.localStorage = localStorageMock

//
// Tests
//

test('should export adapter and store creator', async () => {
  const { localStorage, withStorage, tie } = await import('../src/local')
  assert.type(localStorage, 'function')
  assert.type(withStorage, 'function')
  assert.type(tie, 'function')
})

test.run()
