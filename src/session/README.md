# `sessionStorage` adapter

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

## Functional helper

There is special `persist` forms to use with functional programming style. You can use it, if you like, with Domain hook or `.thru()` store method.

To use it, import `persist` function from `'effector-storage/session/fp'` module:

```javascript
import { createDomain } from 'effector'
import { persist } from 'effector-storage/session/fp'

const app = createDomain('app')

// this hook will persist every store, created in domain,
// in `sessionStorage`, using stores' names as keys
app.onCreateStore(persist())

const $store = app.createStore(0, { name: 'store' })

// or persist single store in `sessionStorage` via .thru
const $counter = createStore(0)
  .on(increment, (state) => state + 1)
  .on(decrement, (state) => state - 1)
  .thru(persist({ key: 'counter' }))
```

## Formulae

```javascript
import { persist } from 'effector-storage/session'
```

- `persist({ store, ...options }): Subscription`
- `persist({ source, target, ...options }): Subscription`

```javascript
import { persist } from 'effector-storage/session/fp'
```

- `persist({ ...options }?): (store: Store) => Store`

### Options

- ... all the [common options](../../README.md#options) from `persist` function.
- `sync`? ([_boolean_]): Add [`'storage'`] event listener or no. Default = `false`.
- `serialize`? (_(value: any) => string_): Custom serialize function. Default = `JSON.stringify`.
- `deserialize`? (_(value: string) => any_): Custom deserialize function. Default = `JSON.parse`.

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

You can use `source`/`target` form of `persist` and `debounce` from [patronum](https://github.com/effector/patronum#debounce), to reach that goal:

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
