import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { createStorageMock } from './mocks/storage.mock'

//
// Mock Storage adapter and events
//

declare let global: any

const sessionStorageMock = createStorageMock()
global.window = {}
global.window.sessionStorage = sessionStorageMock

//
// Tests
//

test('should export adapter and store creator', async () => {
  const { sessionStorage, withStorage, tie } = await import('../src/session')
  assert.type(sessionStorage, 'function')
  assert.type(withStorage, 'function')
  assert.type(tie, 'function')
})

test.run()
