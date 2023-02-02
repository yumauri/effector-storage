import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { version } from 'effector'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const effectorVersion: string = process.env.EFFECTOR_VERSION || '22.0.0'

//
// Tests
//

test('effector should be mocked', () => {
  assert.is(version, effectorVersion)
})

//
// Launch tests
//

test.run()
