import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore, Event } from 'effector'
import { tie, ErrorHandler, StorageAdapter, MandatoryAdapterConfig } from '../src'

//
// Error adapter
//

interface ErrorAdapterConfig {
  errorAfter: number
}

const errorAdapter: StorageAdapter<ErrorAdapterConfig> = <State>(
  _defaultValue: State,
  config: MandatoryAdapterConfig & ErrorAdapterConfig,
  on: {
    error: ErrorHandler
    update: Event<State>
  }
) => {
  if (config.errorAfter !== undefined) {
    setTimeout(() => on.error('Update value from error adapter'), config.errorAfter)
  }

  return {
    get: () => on.error('Get value from error adapter'),
    set: (value: State) => on.error(`Set value "${value}" to error adapter`),
  }
}

//
// Tests
//

test('should call error handler on created tied store', async () => {
  const error = snoop(() => undefined)

  const withError = tie({ with: errorAdapter, errorAfter: 0 })
  const createErrorStore = withError(createStore)
  const store$ = createErrorStore(0, { key: 'test' }).catch(error.fn)

  assert.is(error.callCount, 0)
  ;(store$ as any).setState(1)
  assert.is(error.callCount, 1)
  assert.is(String(error.calls[0].arguments), 'Set value "1" to error adapter')

  await new Promise((resolve) => setTimeout(resolve, 1))

  assert.is(error.callCount, 2)
  assert.is(String(error.calls[1].arguments), 'Update value from error adapter')
})

test('should call error handler on existing tied store', async () => {
  const error = snoop(() => undefined)

  const store$ = createStore(0)
  const tied$ = tie(store$)({ with: errorAdapter, key: 'test', errorAfter: 0 })
  tied$.catch(error.fn)

  assert.is(error.callCount, 0)
  ;(tied$ as any).setState(1)
  assert.is(error.callCount, 1)
  assert.is(String(error.calls[0].arguments), 'Set value "1" to error adapter')

  await new Promise((resolve) => setTimeout(resolve, 1))
  assert.is(error.callCount, 2)
  assert.is(String(error.calls[1].arguments), 'Update value from error adapter')
})

test.run()
