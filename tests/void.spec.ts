import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore, createEvent } from 'effector'
import { tie, ErrorHandler, UpdateHandler, StorageAdapter } from '../src'

//
// Void adapter
//

const voidAdapter: StorageAdapter = <State>(
  _defaultValue: State,
  config: { [key: string]: any },
  on: {
    error: ErrorHandler
    update: UpdateHandler
  }
) => {
  if (config.updateAfter !== undefined) {
    setTimeout(() => on.update(undefined), config.updateAfter)
  }

  return () => undefined
}

const withVoid = tie({ with: voidAdapter })

//
// Tests
//

test('should ignore undefined on created store with created event', async () => {
  const createVoidStore = withVoid(createStore, createEvent)
  const store$ = createVoidStore(0, { key: 'test', updateAfter: 0 })

  assert.is(store$.getState(), 0)
  ;(store$ as any).setState(1)
  assert.is(store$.getState(), 1)

  await new Promise((resolve) => setTimeout(resolve, 1))
  assert.is(store$.getState(), 1)
})

test('should ignore undefined on created store with existing event', async () => {
  const updated = createEvent()
  const watch = snoop(() => undefined)
  updated.watch(watch.fn)

  const createVoidStore = withVoid(createStore, updated)
  const store$ = createVoidStore(0, { key: 'test', updateAfter: 0 })

  assert.is(store$.getState(), 0)
  assert.is(watch.callCount, 0)
  ;(store$ as any).setState(1)
  assert.is(store$.getState(), 1)
  assert.is(watch.callCount, 0)

  await new Promise((resolve) => setTimeout(resolve, 1))
  assert.is(store$.getState(), 1)
  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [undefined])
})

test('should ignore undefined on existing store with new event', async () => {
  const store$ = createStore(0)
  const tied$ = tie(
    store$,
    { with: voidAdapter, key: 'test', updateAfter: 0 },
    createEvent
  )

  assert.is(store$.getState(), 0)
  assert.is(tied$.getState(), 0)
  ;(tied$ as any).setState(1)
  assert.is(store$.getState(), 1)
  assert.is(tied$.getState(), 1)

  await new Promise((resolve) => setTimeout(resolve, 1))
  assert.is(store$.getState(), 1)
  assert.is(tied$.getState(), 1)
})

test('should ignore undefined on existing store with existing event', async () => {
  const updated = createEvent()
  const watch = snoop(() => undefined)
  updated.watch(watch.fn)

  const store$ = createStore(0)
  const tied$ = tie(store$, {
    with: voidAdapter,
    using: updated,
    key: 'test',
    updateAfter: 0,
  })

  assert.is(store$.getState(), 0)
  assert.is(tied$.getState(), 0)
  assert.is(watch.callCount, 0)
  ;(store$ as any).setState(1)
  assert.is(store$.getState(), 1)
  assert.is(tied$.getState(), 1)
  assert.is(watch.callCount, 0)

  await new Promise((resolve) => setTimeout(resolve, 1))
  assert.is(store$.getState(), 1)
  assert.is(tied$.getState(), 1)
  assert.is(watch.callCount, 1)
  assert.equal(watch.calls[0].arguments, [undefined])
})

test.run()
