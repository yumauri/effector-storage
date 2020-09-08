import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore } from 'effector'
import { tie, ErrorHandler, UpdateHandler, StorageAdapter } from '../src'

//
// Error adapter
//

interface ErrorAdapterConfig {
  key: string
  errorAfter: number
}

const errorAdapter: StorageAdapter<ErrorAdapterConfig> = <State>(
  defaultValue: State,
  config: ErrorAdapterConfig,
  on: {
    error: ErrorHandler
    update: UpdateHandler
  }
) => {
  if (config.errorAfter !== undefined) {
    setTimeout(() => {
      on.error('Update value from error adapter')
      on.update(defaultValue)
    }, config.errorAfter)
  }

  return (value?: State) =>
    value === undefined
      ? (on.error('Get value from error adapter'), defaultValue as any)
      : on.error('Set value to error adapter')
}

const withError = tie({ with: errorAdapter })

//
// Tests
//

test('should call error handler on created tied store', async () => {
  const error = snoop(() => undefined)

  const createErrorStore = withError(createStore)
  const store$ = createErrorStore(0, { key: 'test', errorAfter: 0 }).catch(error.fn)

  assert.is(error.callCount, 0)
  ;(store$ as any).setState(1)
  assert.is(error.callCount, 1)
  assert.is(String(error.calls[0].arguments), 'Set value to error adapter')

  await new Promise((resolve) => setTimeout(resolve, 1))
  assert.is(error.callCount, 2)
  assert.is(String(error.calls[1].arguments), 'Update value from error adapter')
})

test('should call error handler on existing tied store', async () => {
  const error = snoop(() => undefined)

  const store$ = createStore(0)
  const tied$ = tie(store$, { with: errorAdapter, key: 'test', errorAfter: 0 })
  tied$.catch(error.fn)

  assert.is(error.callCount, 0)
  ;(tied$ as any).setState(1)
  assert.is(error.callCount, 1)
  assert.is(String(error.calls[0].arguments), 'Set value to error adapter')

  await new Promise((resolve) => setTimeout(resolve, 1))
  assert.is(error.callCount, 2)
  assert.is(String(error.calls[1].arguments), 'Update value from error adapter')
})

test.run()
