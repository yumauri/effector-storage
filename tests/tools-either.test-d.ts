import type {
  LocalStorageConfig,
  LogConfig,
  StorageAdapter,
  StorageAdapterFactory,
} from '../src'
import { it } from 'vitest'
import { either, local, log } from '../src'

function expectType<T>(_value: T): void {}

//
// Tests
//

it('should not accept bad argument', () => {
  // @ts-expect-error should fail on wrong arguments
  either(42, 'test')

  // @ts-expect-error should fail on wrong arguments
  either(local, 'string')

  // @ts-expect-error should fail on wrong arguments
  either(local, { x: 1 })

  // @ts-expect-error should fail on wrong arguments
  either({ x: 1 }, log())

  // @ts-expect-error should fail on wrong arguments
  either(() => undefined, local())
})

it('should infer correct type', () => {
  expectType<StorageAdapter>(either(local(), log()))
  expectType<StorageAdapterFactory<LogConfig>>(either(local(), log))
  expectType<StorageAdapterFactory<LocalStorageConfig>>(either(local, log()))
  expectType<StorageAdapterFactory<LocalStorageConfig & LogConfig>>(
    either(local, log)
  )
})
