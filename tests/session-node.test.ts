import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { nil } from '../src/nil'

//
// Tests
//

declare let global: any

let storage: Storage

test.before(() => {
  // I'm pretty sure this is the bad hack
  // but I need module to be imported and executed anew
  delete require.cache[require.resolve('../src/session')]

  storage = global.sessionStorage
  delete global.sessionStorage
})

test.after(() => {
  global.sessionStorage = storage
})

test("should not fail if sessionStorage does't exists", async () => {
  const { sessionStorage, persist } = await import('../src/session')
  assert.type(sessionStorage, 'function')
  assert.type(persist, 'function')
  assert.ok(sessionStorage === nil)
})

//
// Launch tests
//

test.run()
