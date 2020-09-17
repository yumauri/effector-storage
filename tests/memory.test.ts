import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { snoop } from 'snoop'
import { createStore, createEvent, createDomain, Event, is } from 'effector'
import { tie, ErrorHandler, StorageAdapter, MandatoryAdapterConfig } from '../src'

//
// Memory adapter
//

interface MemoryAdapterConfig<State = any> {
  updateAfter: number
  updateValue: State
}

const memoryAdapter: StorageAdapter<MemoryAdapterConfig> = <State>(
  defaultValue: State,
  config: MandatoryAdapterConfig & MemoryAdapterConfig<State>,
  on: {
    error: ErrorHandler
    update: Event<State>
  }
) => {
  let current = defaultValue

  if (config.updateAfter !== undefined) {
    setTimeout(() => on.update(config.updateValue ?? defaultValue), config.updateAfter)
  }

  return {
    get: () => current,
    set: (value: State) => (current = value),
  }
}

const withMemory = tie({ with: memoryAdapter })

//
// Tests
//

test('should update created tied store with new event', async () => {
  const createMemoryStore = withMemory(createStore)
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

test('should update created tied store with new domain event', async () => {
  const onCreateEvent = snoop(() => undefined)
  const domain = createDomain()
  domain.onCreateEvent(onCreateEvent.fn)

  const createMemoryStore = withMemory({ domain })(createStore)
  const store$ = createMemoryStore(0, {
    key: 'test',
    updateAfter: 0,
    updateValue: 2,
  })

  assert.is(onCreateEvent.callCount, 1)
  assert.ok(is.event(onCreateEvent.calls[0].arguments[0 as any]))

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

  const createMemoryStore = withMemory({ using: updated })(createStore)
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
  const tied$ = tie({
    store: store$,
    with: memoryAdapter,
    key: 'test',
    updateAfter: 0,
    updateValue: 2,
  })

  assert.is(store$.getState(), 0)
  assert.is(tied$.getState(), 0)
  ;(tied$ as any).setState(1)
  assert.is(store$.getState(), 1)
  assert.is(tied$.getState(), 1)

  await new Promise((resolve) => setTimeout(resolve, 1))
  assert.is(store$.getState(), 2)
  assert.is(tied$.getState(), 2)
})

test('should update existing tied store with new domain event', async () => {
  const onCreateEvent = snoop(() => undefined)
  const domain = createDomain()
  domain.onCreateEvent(onCreateEvent.fn)

  const store$ = createStore(0)
  const tied$ = tie({
    store: store$,
    with: memoryAdapter,
    domain,
    key: 'test',
    updateAfter: 0,
    updateValue: 2,
  })

  assert.is(onCreateEvent.callCount, 1)
  assert.ok(is.event(onCreateEvent.calls[0].arguments[0 as any]))

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
  const updated = createEvent<number>()
  const watch = snoop(() => undefined)
  updated.watch(watch.fn)

  const store$ = createStore(0)
  const tied$ = tie({
    store: store$,
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

test('should use domain to create tied store', async () => {
  const onCreateStore = snoop(() => undefined)
  const onCreateEvent = snoop(() => undefined)
  const domain = createDomain()
  domain.onCreateStore(onCreateStore.fn)
  domain.onCreateEvent(onCreateEvent.fn)

  const createMemoryStore = withMemory(domain)
  const store$ = createMemoryStore(0, {
    key: 'test',
    updateAfter: 0,
    updateValue: 2,
  })

  assert.is(onCreateStore.callCount, 1)
  assert.is(onCreateEvent.callCount, 1)
  assert.ok(is.store(onCreateStore.calls[0].arguments[0 as any]))
  assert.ok(is.event(onCreateEvent.calls[0].arguments[0 as any]))

  assert.is(store$.getState(), 0)
  ;(store$ as any).setState(1)
  assert.is(store$.getState(), 1)

  await new Promise((resolve) => setTimeout(resolve, 1))
  assert.is(store$.getState(), 2)
})

test.run()
