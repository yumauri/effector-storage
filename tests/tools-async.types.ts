import type {
  StorageAdapter,
  StorageAdapterFactory,
  LocalStorageConfig,
} from '../src'
import { test } from 'uvu'
import { local, async } from '../src'
import { expectType } from 'tsd'

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

//
// DO NOT launch tests, because they will fail in runtime
// TypeScript will do the job for us, by checking the syntax
//
