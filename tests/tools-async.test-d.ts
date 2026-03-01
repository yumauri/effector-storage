import type {
  StorageAdapter,
  StorageAdapterFactory,
  LocalStorageConfig,
} from '../src'
import { it } from 'vitest'
import { local, async } from '../src'

function expectType<T>(_value: T): void {}

//
// Tests
//

it('should not accept bad argument', () => {
  // @ts-expect-error should fail on wrong arguments
  async(42)

  // @ts-expect-error should fail on wrong arguments
  async('string')

  // @ts-expect-error should fail on wrong arguments
  async({ x: 1 })

  // @ts-expect-error should fail on wrong arguments
  async(() => undefined)
})

it('should infer correct type', () => {
  expectType<StorageAdapter>(async(local()))
  expectType<StorageAdapterFactory<LocalStorageConfig>>(async(local))
})
