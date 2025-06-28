import { test } from 'node:test'
import * as assert from 'node:assert/strict'
import { version } from 'effector'

const tryDependency: string | undefined = process.env.INPUT_EFFECTOR

//
// Tests
//

test('effector should be mocked', () => {
  const tryVersion = tryDependency?.match(/(\d+\.\d+\.\d+).*$/)?.[0]
  if (tryVersion) {
    assert.strictEqual(version, tryVersion)
  } else {
    console.log('unknown try version:', tryDependency)
    console.log('effector version:', version)
  }
})
