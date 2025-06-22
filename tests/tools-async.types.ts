import type {
  StorageAdapter,
  StorageAdapterFactory,
  LocalStorageConfig,
} from '../src'
import { local, async } from '../src'
import { expectType } from 'tsd'

// fake `test` function which will not be runned
// TypeScript will do the job for us, by checking the syntax
// without actual execution
function test(_name: string, _test: () => any) {}

//
// Tests
//

test('should not accept bad argument', () => {
  // @ts-expect-error should fail on wrong arguments
  async(42)

  // @ts-expect-error should fail on wrong arguments
  async('string')

  // @ts-expect-error should fail on wrong arguments
  async({ x: 1 })

  // @ts-expect-error should fail on wrong arguments
  async(() => undefined)
})

test('should infer correct type', () => {
  expectType<StorageAdapter>(async(local()))
  expectType<StorageAdapterFactory<LocalStorageConfig>>(async(local))
})
