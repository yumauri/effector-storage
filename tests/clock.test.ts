import { createEvent, createStore } from 'effector'
import { expect, it } from 'vitest'
import { persist } from '../src/core'
import { storage } from '../src/storage'
import { createStorageMock } from './mocks/storage.mock'

//
// Tests
//

it('should set value to storage only on `clock` trigger', () => {
  const mockStorage = createStorageMock()
  mockStorage.setItem('$store', '0')

  const adapter = storage({ storage: () => mockStorage })

  const clock = createEvent()
  const $store = createStore(1, { name: '$store' })
  expect($store.getState()).toBe(1)

  persist({ store: $store, clock, adapter })
  expect($store.getState()).toBe(0) // <- restore from storage

  // change store value
  ;($store as any).setState(1)
  expect(mockStorage.getItem('$store')).toBe('0') // <- didn't changed
  ;($store as any).setState(2)
  expect(mockStorage.getItem('$store')).toBe('0') // <- didn't changed

  clock()
  expect(mockStorage.getItem('$store')).toBe('2') // <- actually set
})
