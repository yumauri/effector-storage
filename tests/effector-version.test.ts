import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { version } from 'effector'

const tryDependency: string | undefined = process.env.INPUT_EFFECTOR

//
// Tests
//

test('effector should be mocked', () => {
  const tryVersion = tryDependency?.match(/(\d+\.\d+\.\d+)/)?.[1]
  if (tryVersion) {
    assert.is(version, tryVersion)
  } else {
    console.log('unknown try version:', tryDependency)
    console.log('effector version:', version)
  }
})

//
// Launch tests
//

test.run()
