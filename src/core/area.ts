import type { Store } from 'effector'
import { createStore } from 'effector'

/**
 * Keys areas / namespaces cache
 */
const areas = new Map<any, Map<string, Store<any>>>()

/**
 * Get store, responsible for the key in key area / namespace
 */
export function getAreaStorage<State>(keyArea: any, key: string): Store<State> {
  let area = areas.get(keyArea)
  if (area === undefined) {
    area = new Map()
    areas.set(keyArea, area)
  }

  let store = area.get(key)
  if (store !== undefined) {
    return store
  }

  store = createStore(null, { serialize: 'ignore' })
  area.set(key, store)

  return store
}
