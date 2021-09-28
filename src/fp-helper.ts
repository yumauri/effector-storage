import type { Store, Subscription } from 'effector'

type LikePersist = {
  (config: any): Subscription
}

/**
 * Helper to make any `persist` function like functional
 */
export const fp =
  <Config>(persist: LikePersist) =>
  (config?: Config) =>
  <State>(store: Store<State>): Store<State> => {
    persist({ store, ...config })
    return store
  }
