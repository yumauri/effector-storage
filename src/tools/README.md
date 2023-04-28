# Adapter utility functions

## `async`

Makes synchronous storage adapter asynchronous.

```javascript
import { persist, async, local } from 'effector-storage'

persist({
  adapter: async(local),
  store: $counter,
  done: valueRestored,
})

// add watcher AFTER persist
valueRestored.watch(({ value }) => console.log(value))
```

Without specifying `pickup` property, calling `persist` will immediately call adapter to get initial value. In case of synchronous storage (like `localStorage` or `sessionStorage`) this action will synchronously set store value, and call `done`/`fail`/`finally` right away (see issue [#38](https://github.com/yumauri/effector-storage/issues/38) for more details).

With `async` utility function you can modify adapter to be asynchronous to mitigate this behavior.

## `either`

Given two adapters, this function will return first one, either second one, if first one is "no-op" adapter.

```javascript
import { persist, either, local, log } from 'effector-storage'

// - in browser environment will persist
//   store `$counter` in `localStorage` with key 'counter'
// - in node environment will just log persist activity
persist({
  adapter: either(local, log),
  store: $counter,
  key: 'counter',
})
```

Adapter can be marked as "no-op" using property `noop: true`. If first adapter, given to `either` function, is no-op adapter — `either` function will return second one.

This can be useful with code, which runs in different environments, for example, with server-side rendering same code will run in node, and in browser. There is no `localStorage` support in node, so `local` adapter will be marked as no-op (it will use no-op `nil` adapter under the hood).

Note, that `either` will not fallback to second adapter in case of read/write error in the first one. Second adapter will be used _only_ in case first adapter is not supported within the environment.

## `farcached`

Wraps [`@farfetched/core`](https://farfetched.pages.dev/api/operators/cache.html) cache adapter to be used as `persist` adapter :)

```javascript
import { persist, farcached } from 'effector-storage'
import { localStorageCache } from '@farfetched/core'

persist({
  store: $store,
  adapter: farcached(localStorageCache({ maxAge: '15m' })),
  key: 'store',
})
```

Out of the box Farfetched provides 4 cache adapters:

- `inMemoryCache`
- `sessionStorageCache`
- `localStorageCache`
- `voidCache` (this one is no-op)

From real usage point of view, using Farfetched cache adapters could be useful, when you need logic for cache invalidation, because all of provided adapters have `maxAge` option.

Also, you could use Farfetched cache adapters to inject different cache adapters with `fork` using [`cache.__.$instance`](https://farfetched.pages.dev/recipes/server_cache.html#inject-adapter) internal store.
