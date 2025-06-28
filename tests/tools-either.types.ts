import type {
  StorageAdapter,
  StorageAdapterFactory,
  LocalStorageConfig,
  LogConfig,
} from '../src'
import { local, log, either } from '../src'
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

test('should infer correct type', () => {
  expectType<StorageAdapter>(either(local(), log()))
  expectType<StorageAdapterFactory<LogConfig>>(either(local(), log))
  expectType<StorageAdapterFactory<LocalStorageConfig>>(either(local, log()))
  expectType<StorageAdapterFactory<LocalStorageConfig & LogConfig>>(
    either(local, log)
  )
})
