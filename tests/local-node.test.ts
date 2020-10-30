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
  delete require.cache[require.resolve('../src/local')]

  storage = global.localStorage
  delete global.localStorage
})

test.after(() => {
  global.localStorage = storage
})

test("should not fail if localStorage does't exists", async () => {
  const { localStorage, persist } = await import('../src/local')
  assert.type(localStorage, 'function')
  assert.type(persist, 'function')
  assert.ok(localStorage === nil)
})

//
// Launch tests
//

test.run()
