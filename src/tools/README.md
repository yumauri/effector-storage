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

Without specifying the `pickup` property, calling `persist` will immediately call the adapter to get the initial value. In case of synchronous storage (like `localStorage` or `sessionStorage`), this action will synchronously set store value and call `done`/`fail`/`finally` right away (see issue [#38](https://github.com/yumauri/effector-storage/issues/38) for more details).

With the `async` utility function, you can modify an adapter to be asynchronous to mitigate this behavior.

## `either`

Given two adapters, this function will return the first one, or the second one if the first one is a "no-op" adapter.

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

An adapter can be marked as "no-op" using the `noop: true` property. If the first adapter given to `either` is a no-op adapter, `either` will return the second one.

This can be useful with code that runs in different environments. For example, with server-side rendering, the same code will run in Node and in the browser. There is no `localStorage` support in Node, so the `local` adapter will be marked as no-op (it will use the no-op `nil` adapter under the hood).

Note that `either` will not fall back to the second adapter in case of a read/write error in the first one. The second adapter will be used _only_ when the first adapter is not supported within the environment.

## `farcached`

Wraps [`@farfetched/core`](https://ff.effector.dev/api/operators/cache.html) cache adapter to be used as `persist` adapter :)

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

From a practical point of view, using Farfetched cache adapters can be useful when you need cache invalidation logic, because all provided adapters have a `maxAge` option.

Also, you could use Farfetched cache adapters to inject different cache adapters with `fork` using [`cache.__.$instance`](https://ff.effector.dev/recipes/server_cache.html#inject-adapter) internal store.
