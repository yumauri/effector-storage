import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { version } from 'effector'

const effectorVersion: string = process.env.EFFECTOR_VERSION || '22.0.0'
const isTryEffectorVersion: string | undefined = process.env.TRY_VERSION
const tryEffectorVersion: string | undefined = process.env.INPUT_EFFECTOR

//
// Tests
//

test('effector should be mocked', () => {
  if (isTryEffectorVersion) {
    const tryVersion = tryEffectorVersion?.match(/(\d+\.\d+\.\d+)/)?.[1]
    if (tryVersion) {
      assert.is(version, tryVersion)
    } else {
      console.log('unknown try version:', tryEffectorVersion)
    }
  } else {
    assert.is(version, effectorVersion)
  }
})

//
// Launch tests
//

test.run()
