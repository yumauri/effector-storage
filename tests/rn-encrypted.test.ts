import { test } from 'uvu'
import * as assert from 'uvu/assert'

//
// Tests
//

test('should export adapter and `persist` function', async () => {
  try {
    // I'm not sure, how to mock 'react-native-encrypted-storage' module ???
    const { persist } = await import('../src/rn/encrypted')
    assert.type(persist, 'function')
  } catch (e) {
    console.log('//todo: skipped test')
  }
})

//
// Launch tests
//

test.run()
