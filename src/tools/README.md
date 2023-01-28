# Adapter utility functions

## `either`

```javascript
import { persist, either, local, log } from 'effector-storage'

// - in browser environment will persist
//   store `$counter` in `localStorage` with key 'counter'
// - in node environment will just log persist activity
persist({
  adapter: either(local(), log()),
  store: $counter,
  key: 'counter',
})
```

Adapter can be marked as "no-op" using property `noop: true`. If first adapter, given to `either` function, is no-op adapter — `either` function will return second one.

This can be useful with code, which runs in different environments, for example, with server-side rendering same code will run in node, and in browser. There is no `localStorage` support in node, so `local` adapter will be marked as no-op (it will use no-op `nil` adapter under the hood).

Note, that `either` will not fallback to second adapter in case of read/write error in the first one. Second adapter will be used _only_ in case first adapter is not supported within the environment.
