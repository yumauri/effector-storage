/* eslint ava/no-import-test-files: "off" */

const test = require('ninos')(require('ava'))
const createStorageMock = require('./storage.mock')
const createEventsMock = require('./events.mock')
const { createStore, is } = require('effector')
const { withStorage } = require('../sync')

const events = createEventsMock()
global.addEventListener = events.addEventListener

const localStorage = createStorageMock()
const createSyncStorageStore = withStorage(createStore, localStorage)

test('Sync wrapper function should return Store object', t => {
  const $counter = createSyncStorageStore(0, { key: 'counter1' })
  t.true(is.store($counter))
})

test('Sync Store should be updated from storage', async t => {
  const $counter = createSyncStorageStore(0, { key: 'counter2' })
  t.is(localStorage.getItem('counter2'), '0')
  t.is($counter.getState(), JSON.parse(localStorage.getItem('counter2')))

  localStorage.setItem('counter2', '1')
  await events.dispatchEvent('storage', {
    key: 'counter2',
    oldValue: '0',
    newValue: '1',
  })

  t.is($counter.getState(), 1)
})

test('Broken store value should cause .catch() to execute', async t => {
  const handler = t.context.stub()

  const $counter = createSyncStorageStore(0, { key: 'counter3' }).catch(handler)
  t.is(localStorage.getItem('counter3'), '0')
  t.is($counter.getState(), JSON.parse(localStorage.getItem('counter3')))

  localStorage.setItem('counter3', 'broken')
  await events.dispatchEvent('storage', {
    key: 'counter3',
    oldValue: '0',
    newValue: 'broken',
  })

  t.is(handler.calls.length, 1)
  t.is(handler.calls[0].arguments.length, 1)
  t.true(handler.calls[0].arguments[0] instanceof SyntaxError)

  t.is(localStorage.getItem('counter3'), 'broken')
  t.is($counter.getState(), 0)
})
