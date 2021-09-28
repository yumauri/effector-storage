import type { Store, Subscription } from 'effector'

type LikePersist = {
  (config: any): Subscription
}

type Curried = {
  <State>(store: Store<State>): Store<State>
}

/**
 * Helper to make any `persist` function like functional
 */
export const fp =
  <Config>(persist: LikePersist) =>
  (config?: Config): Curried => {
    console.error(`/fp is deprecated, use regular form instead`)
    return <State>(store: Store<State>): Store<State> => {
      persist({ store, ...config })
      return store
    }
  }
