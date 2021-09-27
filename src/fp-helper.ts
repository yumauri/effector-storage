import type { Store, Subscription } from 'effector'

type LikePersist<P> = P extends {
  (config: any): Subscription
}
  ? P
  : never

type GetConfig<P> = P extends {
  (config: infer C): Subscription
}
  ? C
  : never

/**
 * Helper to make any `persist` function like functional
 */
export const fp =
  <Persist>(persist: LikePersist<Persist>) =>
  (config?: Omit<GetConfig<Persist>, 'store'>) =>
  <State>(store: Store<State>): Store<State> => {
    persist({ store, ...config })
    return store
  }
