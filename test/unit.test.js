/* eslint ava/no-import-test-files: "off" */

const test = require('ninos')(require('ava'))
const createEventsMock = require('./events.mock')
const createStorageMock = require('./storage.mock')
const { createStore, forward, restore } = require('effector')
const { createStorage } = require('../unit')

const events = createEventsMock()
global.addEventListener = events.addEventListener
global.localStorage = createStorageMock()

test('Store should be set from storage right away', t => {
  localStorage.setItem('counter1', '42')

  const storage = createStorage()
  const $counter = restore(storage.get('counter1'), 0)

  t.is($counter.getState(), 0)

  storage({ key: 'counter1' })

  t.is($counter.getState(), 42)
})

test('Storage unit should set value to storage', t => {
  const storage = createStorage()
  const $counter = createStore(0)

  forward({
    from: $counter,
    to: storage.set('counter2'),
  })

  $counter.setState(3)

  t.is(localStorage.getItem('counter2'), '3')
})

test('Storage unit should emit value from storage', async t => {
  const storage = createStorage()
  const $counter = createStore(0)

  forward({
    from: storage.get('counter3'),
    to: $counter,
  })

  localStorage.setItem('counter3', '3')
  await events.dispatchEvent('storage', { key: 'counter3' })

  t.is($counter.getState(), 3)
})

test('Set broken value should emit .fail event', t => {
  const storage = createStorage()
  const $store = createStore({ test: 1 })

  forward({
    from: $store,
    to: storage.set('store1'),
  })

  const watcher = t.context.stub()
  storage.fail.watch(watcher)

  const recursive = {}
  recursive.recursive = recursive
  $store.setState(recursive)

  t.is(watcher.calls.length, 1)
  t.is(watcher.calls[0].arguments.length, 1)
  t.true(watcher.calls[0].arguments[0].error instanceof TypeError)

  t.is(localStorage.getItem('store1'), null)
  t.is($store.getState(), recursive)
})

test('Broken storage value should emit .fail event', async t => {
  const storage = createStorage()
  const $store = createStore({ test: 1 })

  forward({
    from: storage.get('store2'),
    to: $store,
  })

  const watcher = t.context.stub()
  storage.fail.watch(watcher)

  localStorage.setItem('store2', 'broken')
  await events.dispatchEvent('storage', { key: 'store2' })

  t.is(watcher.calls.length, 1)
  t.is(watcher.calls[0].arguments.length, 1)
  t.true(watcher.calls[0].arguments[0].error instanceof SyntaxError)

  t.is(localStorage.getItem('store2'), 'broken')
  t.deepEqual($store.getState(), { test: 1 })
})

test('Storage unit getter should not duplicate nodes', t => {
  const storage = createStorage()
  const get1 = storage.get('test')
  const get2 = storage.get('test')
  t.true(get1 === get2)
})

test('Storage unit setter should not duplicate nodes', t => {
  const storage = createStorage()
  const set1 = storage.set('test')
  const set2 = storage.set('test')
  t.true(set1 === set2)
})

test('Non existent key should return undefined', t => {
  const storage = createStorage()
  const get = storage.get('test')
  const set = storage.set('test')

  const watcher = t.context.stub()
  get.watch(watcher)

  storage({ key: 'test' })
  set('value')

  t.deepEqual(watcher.calls, [
    { this: undefined, arguments: [undefined], return: undefined },
    { this: undefined, arguments: ['value'], return: undefined },
  ])
})
