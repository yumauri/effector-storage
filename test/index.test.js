/* eslint ava/no-import-test-files: "off" */

const test = require('ninos')(require('ava'))
const createStorageMock = require('./storage.mock')
const { createEvent, createStore, is } = require('effector')
const { withStorage } = require('..')

global.localStorage = createStorageMock()
const createStorageStore = withStorage(createStore)

test('wrapper function should return Store object', t => {
  const $counter = createStorageStore(0, { key: 'counter1' })
  t.true(is.store($counter))
})

test('returned Store object should has new method .catch(..)', t => {
  const $counter = createStorageStore(0, { key: 'counter2' })
  t.is(typeof $counter.catch, 'function')
  t.true($counter.catch(_ => {}) === $counter)
})

test('Store initial value should be saved to storage', t => {
  const $counter = createStorageStore(0, { key: 'counter3' })
  t.is(localStorage.getItem('counter3'), '0')
  t.is($counter.getState(), JSON.parse(localStorage.getItem('counter3')))
})

test('Store new value should be saved to storage', t => {
  const $counter = createStorageStore(0, { key: 'counter4' })
  t.is(localStorage.getItem('counter4'), '0')
  t.is($counter.getState(), JSON.parse(localStorage.getItem('counter4')))
  $counter.setState(3)
  t.is(localStorage.getItem('counter4'), '3')
  t.is($counter.getState(), JSON.parse(localStorage.getItem('counter4')))
})

test('Store should be initialized from storage value', t => {
  localStorage.setItem('counter5', '42')
  const $counter = createStorageStore(0, { key: 'counter5' })
  t.is(localStorage.getItem('counter5'), '42')
  t.is($counter.getState(), 42)
})

test('Reset store should reset it to given initial value', t => {
  localStorage.setItem('counter6', '42')
  const reset = createEvent()
  const $counter = createStorageStore(0, { key: 'counter6' }).reset(reset)
  t.is(localStorage.getItem('counter6'), '42')
  t.is($counter.getState(), 42)
  reset()
  t.is(localStorage.getItem('counter6'), '0')
  t.is($counter.getState(), 0)
})

test('Broken storage value should be ignored', t => {
  localStorage.setItem('counter7', 'broken')
  const $counter = createStorageStore(13, { key: 'counter7' })
  t.is(localStorage.getItem('counter7'), '13')
  t.is($counter.getState(), 13)
})

test.failing('Broken storage value should cause .catch() to execute', t => {
  const handler = t.context.stub()

  localStorage.setItem('counter8', 'broken')
  const $counter = createStorageStore(13, { key: 'counter8' }).catch(handler)

  t.is(handler.calls.length, 1)
  t.is(handler.calls[0].arguments.length, 1)
  t.true(handler.calls[0].arguments[0] instanceof SyntaxError)

  t.is(localStorage.getItem('counter8'), '13')
  t.is($counter.getState(), 13)
})

test('Should not fail if error handler is absent', t => {
  const $store = createStorageStore({ test: 1 }, { key: 'store0' })
  t.is(localStorage.getItem('store0'), '{"test":1}')
  t.deepEqual($store.getState(), { test: 1 })

  const recursive = {}
  recursive.recursive = recursive
  $store.setState(recursive)

  t.is(localStorage.getItem('store0'), '{"test":1}')
  t.is($store.getState(), recursive)
})

test('Broken store value should cause .catch() to execute', t => {
  const handler = t.context.stub()

  const $store = createStorageStore({ test: 1 }, { key: 'store' }).catch(
    handler
  )
  t.is(localStorage.getItem('store'), '{"test":1}')
  t.deepEqual($store.getState(), { test: 1 })

  const recursive = {}
  recursive.recursive = recursive
  $store.setState(recursive)

  t.is(handler.calls.length, 1)
  t.is(handler.calls[0].arguments.length, 1)
  t.true(handler.calls[0].arguments[0] instanceof TypeError)

  t.is(localStorage.getItem('store'), '{"test":1}')
  t.is($store.getState(), recursive)
})

test('Custom storage instance should not interfere with global', t => {
  const sessionStorage = createStorageMock()
  const createStorageStore = withStorage(createStore, sessionStorage)

  localStorage.setItem('custom', '111')
  sessionStorage.setItem('custom', '222')

  const $counter = createStorageStore(0, { key: 'custom' })

  t.is(localStorage.getItem('custom'), '111')
  t.is(sessionStorage.getItem('custom'), '222')
  t.is($counter.getState(), 222)

  $counter.setState(333)
  t.is(localStorage.getItem('custom'), '111')
  t.is(sessionStorage.getItem('custom'), '333')
  t.is($counter.getState(), JSON.parse(sessionStorage.getItem('custom')))
})
