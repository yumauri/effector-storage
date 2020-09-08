import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore, createEvent } from 'effector'
import { tie, ErrorHandler, UpdateHandler, StorageAdapter } from '../src'

//
// Memory adapter
//

const memoryAdapter: StorageAdapter = <State>(
  defaultValue: State,
  config: { [key: string]: any },
  on: {
    error: ErrorHandler
    update: UpdateHandler
  }
) => {
  let current = defaultValue

  if (config.updateAfter !== undefined) {
    setTimeout(() => on.update(config.updateValue ?? defaultValue), config.updateAfter)
  }

  return (value?: State) => (value === undefined ? current : (current = value))
}

const withMemory = tie({ with: memoryAdapter })

//
// Tests
//

test('should update created tied store with new event', async () => {
  const createMemoryStore = withMemory(createStore, createEvent)
  const store$ = createMemoryStore(0, {
    key: 'test',
    updateAfter: 0,
    updateValue: 2,
  })

  assert.is(store$.getState(), 0)
  ;(store$ as any).setState(1)
  assert.is(store$.getState(), 1)

  await new Promise((resolve) => setTimeout(resolve, 1))
  assert.is(store$.getState(), 2)
})

test('should update created tied store with existing event', async () => {
  const updated = createEvent()
  const watch = snoop(() => undefined)
  updated.watch(watch.fn)

  const createMemoryStore = withMemory(createStore, updated)
  const store$ = createMemoryStore(0, {
    key: 'test',
    updateAfter: 0,
    updateValue: 2,
  })

  assert.is(store$.getState(), 0)
  assert.is(watch.callCount, 0)
  ;(store$ as any).setState(1)
  assert.is(store$.getState(), 1)
  assert.is(watch.callCount, 0)

  await new Promise((resolve) => setTimeout(resolve, 1))
  assert.is(store$.getState(), 2)
  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [2])
})

test('should update existing tied store with new event', async () => {
  const store$ = createStore(0)
  const tied$ = tie(
    store$,
    { with: memoryAdapter, key: 'test', updateAfter: 0, updateValue: 2 },
    createEvent
  )

  assert.is(store$.getState(), 0)
  assert.is(tied$.getState(), 0)
  ;(tied$ as any).setState(1)
  assert.is(store$.getState(), 1)
  assert.is(tied$.getState(), 1)

  await new Promise((resolve) => setTimeout(resolve, 1))
  assert.is(store$.getState(), 2)
  assert.is(tied$.getState(), 2)
})

test('should update existing tied store with existing event', async () => {
  const updated = createEvent()
  const watch = snoop(() => undefined)
  updated.watch(watch.fn)

  const store$ = createStore(0)
  const tied$ = tie(store$, {
    with: memoryAdapter,
    using: updated,
    key: 'test',
    updateAfter: 0,
    updateValue: 2,
  })

  assert.is(store$.getState(), 0)
  assert.is(tied$.getState(), 0)
  assert.is(watch.callCount, 0)
  ;(store$ as any).setState(1)
  assert.is(store$.getState(), 1)
  assert.is(tied$.getState(), 1)
  assert.is(watch.callCount, 0)

  await new Promise((resolve) => setTimeout(resolve, 1))
  assert.is(store$.getState(), 2)
  assert.is(tied$.getState(), 2)
  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [2])
})

test.run()
