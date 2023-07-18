# `sessionStorage` adapter

[![bundlejs](https://deno.bundlejs.com/badge?q=effector-storage/session&treeshake=[{persist}]&config={%22esbuild%22:{%22external%22:[%22effector%22]}})](https://bundlejs.com/?q=effector-storage%2Fsession&treeshake=%5B%7Bpersist%7D%5D&config=%7B%22esbuild%22%3A%7B%22external%22%3A%5B%22effector%22%5D%7D%7D)

Adapter to persist [_store_] in browser's [sessionStorage].

## Usage

Import `persist` function from `'effector-storage/session'` module, and it will just work:

```javascript
import { persist } from 'effector-storage/session'

// persist store `$counter` in `sessionStorage` with key 'counter'
persist({ store: $counter, key: 'counter' })

// if your storage has a name, you can omit `key` field
persist({ store: $counter })
```

Two (or more) different stores, persisted with the same key, will be synchronized, even if not connected with each other directly — each store will receive updates from another one.

## Formulae

```javascript
import { persist } from 'effector-storage/session'
```

- `persist({ store, ...options }): Subscription`
- `persist({ source, target, ...options }): Subscription`

### Options

- ... all the [common options](../../README.md#options) from `persist` function.
- `sync`? ([_boolean_] | 'force'): Add [`'storage'`] event listener or no. Default = `false`. In case of `'force'` value adapter will always read new value from `sessionStorage`, instead of event.
- `serialize`? (_(value: any) => string_): Custom serialize function. Default = `JSON.stringify`.
- `deserialize`? (_(value: string) => any_): Custom deserialize function. Default = `JSON.parse`.
- `timeout`?: ([_number_]): Timeout in milliseconds, which will be used to throttle writes to `sessionStorage`. Default = `undefined` (meaning updates will be set to the `sessionStorage` immediately)
- `def`?: (_any_): Default value, which will be passed to `store`/`target` in case of absent storage value. Default = `store.defaultState` or `null`.

## Adapter

```javascript
import { session } from 'effector-storage'
```

or

```javascript
import { session } from 'effector-storage/session'
```

- `session(options?): StorageAdapter`

### Options

- `sync`? ([_boolean_] | 'force'): Add [`'storage'`] event listener or no. Default = `false`. In case of `'force'` value adapter will always read new value from `sessionStorage`, instead of event.
- `serialize`? (_(value: any) => string_): Custom serialize function. Default = `JSON.stringify`.
- `deserialize`? (_(value: string) => any_): Custom deserialize function. Default = `JSON.parse`.
- `timeout`?: ([_number_]): Timeout in milliseconds, which will be used to throttle writes to `sessionStorage`. Default = `undefined` (meaning updates will be set to the `sessionStorage` immediately)
- `def`?: (_any_): Default value, which will be passed to `store`/`target` in case of absent storage value. Default = `store.defaultState` or `null`.

## FAQ

### How do I use custom serialization / deserialization?

Options `serialize` and `deserialize` are got you covered. But make sure, that serialization is stable, meaning, that `deserialize(serialize(object))` is equal to `object` (or `serialize(deserialize(serialize(object))) === serialize(object)`):

```javascript
import { persist } from 'effector-storage/session'

const $date = createStore(new Date(), { name: 'date' })

persist({
  store: $date,
  serialize: (date) => String(date.getTime()),
  deserialize: (timestamp) => new Date(Number(timestamp)),
})
```

### Can I debounce updates, `sessionStorage` is too slow?

Since version **4.3.0**, you can use `clock` option and `debounce` from [patronum](https://github.com/effector/patronum/tree/main/debounce), to reach that goal:

```javascript
import { debounce } from 'patronum/debounce'
import { persist } from 'effector-storage/session'

// ---8<---
persist({
  store: $store,
  clock: debounce({ source: $store, timeout: 100 }),
})
```

Or you can use `source`/`target` form of `persist` (and also `debounce` from [patronum](https://github.com/effector/patronum/tree/main/debounce)):

```javascript
import { debounce } from 'patronum/debounce'
import { persist } from 'effector-storage/session'

const setWidth = createEvent()
const setWidthDebounced = debounce({
  source: setWidth,
  timeout: 100,
})

const $windowWidth = createStore(window.innerWidth) //
  .on(setWidth, (_, width) => width)

persist({
  source: setWidthDebounced,
  target: $windowWidth,
  key: 'width',
})

// `setWidth` event will be called on every 'resize' event,
// `$windowWidth` store will be updated accordingly
// but `sessionStorage` will be updated only on debounced event
window.addEventListener('resize', () => {
  setWidth(window.innerWidth)
})
```

[sessionstorage]: https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
[`'storage'`]: https://developer.mozilla.org/en-US/docs/Web/API/StorageEvent
[_subscription_]: https://effector.dev/docs/glossary#subscription
[_store_]: https://effector.dev/docs/api/effector/store
[_function_]: https://developer.mozilla.org/en-US/docs/Glossary/Function
[_boolean_]: https://developer.mozilla.org/en-US/docs/Glossary/Boolean
[_number_]: https://developer.mozilla.org/en-US/docs/Glossary/Number
