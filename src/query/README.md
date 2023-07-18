# Query string adapter

[![bundlejs](https://deno.bundlejs.com/badge?q=effector-storage/query&treeshake=[{persist}]&config={%22esbuild%22:{%22external%22:[%22effector%22]}})](https://bundlejs.com/?q=effector-storage%2Fquery&treeshake=%5B%7Bpersist%7D%5D&config=%7B%22esbuild%22%3A%7B%22external%22%3A%5B%22effector%22%5D%7D%7D)

Adapter to persist [_store_] in [location.search](https://developer.mozilla.org/en-US/docs/Web/API/Location/search)'s query string.

## Usage

To use this adapter, import `persist` function from `'effector-storage/query'` module:

```javascript
import { persist } from 'effector-storage/query'

// persist store `$id` in query string with param name 'id'
persist({ store: $id, key: 'id' })

// if your storage has a name, you can omit `key` field
persist({ store: $id })
```

Two (or more) different stores, persisted with the same key, will be synchronized, even if not connected with each other directly — each store will receive updates from another one.

## URL change method

There are few ways to change URL query string in modern world, you can use one of these four:

- `pushState` — uses [history.pushState](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState) call, it doesn't reload page, and adds new history item.
- `replaceState` — uses [history.replaceState](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState) call, it doesn't reload page, and _doesn't_ add new history item.
- `locationAssign` — uses [location.assign](https://developer.mozilla.org/en-US/docs/Web/API/Location/assign) call, it will reload page, and adds new history item.
- `locationReplace` — uses [location.replace](https://developer.mozilla.org/en-US/docs/Web/API/Location/replace) call, it will reload page, and _doesn't_ add new history item.

By default, `pushState` method is used, but you can change it using `method` option:

```javascript
import { persist, replaceState } from 'effector-storage/query'

// use `history.replaceState` to change query string
persist({ store: $id, key: 'id', method: replaceState })
```

## ⚠️ Updates batching

By default, updates are applied immediately and synchronously, so, several states, persisted in the query string, will cause several history updates, even if updates were happen (almost) simultaneously.<br>
If you have two stores, persisted in query string, and they both updates — you will have two history records (when using default `pushState` method). Thus if you want to go back using "⬅️Back" button — you will have to click it twice, to revert both stores in the original state.<br>
Sometimes it can lead to nasty cyclic updates, if two stores are dependant from each other.

To avoid this, you can use `timeout` option, which will throttle updates, and will apply them only after some time:

```javascript
persist({ store: $page, key: 'page', timeout: 10 })
persist({ store: $count, key: 'count', timeout: 10 })
```

If those two stores will be updated simultaneously (within 10 milliseconds), only one history record will be created, and "⬅️Back" button will revert both stores to the original state.

Note though, _all_ updates are collected in single buffer, regardless of URL change method, and are flushed after _shortest_ given timeout. This is because, event with different URL change methods, you still have only single _medium_ — location query string.

## Formulae

```javascript
import { persist } from 'effector-storage/query'
```

- `persist({ store, ...options }): Subscription`
- `persist({ source, target, ...options }): Subscription`

### Options

- ... all the [common options](../../README.md#options) from `persist` function.
- `method`?: ([_function_]): One of `pushState`, `replaceState`, `locationAssign` or `locationReplace`. Default = `pushState`.
- `state`?: (`'keep'` | `'erase'`): If `method` is `pushState` or `replaceState` — should current state be preserved or replaced with `null`. Default = `keep`.
- `serialize`? (_(value: any) => string_): Custom serialize function.
- `deserialize`? (_(value: string) => any_): Custom deserialize function.
- `timeout`?: ([_number_]): Timeout in milliseconds, which will be used to throttle updates. Default = `undefined` (meaning updates will be applied immediately)
- `def`?: (_any_): Default value, which will be passed to `store`/`target` in case of absent query parameter. Default = `store.defaultState` or `null`.

## Adapter

```javascript
import { query } from 'effector-storage'
```

or

```javascript
import { query } from 'effector-storage/query'
```

- `query(options?): StorageAdapter`

### Options

- `method`?: ([_function_]): One of `pushState`, `replaceState`, `locationAssign` or `locationReplace`. Default = `pushState`.
- `state`?: (`'keep'` | `'erase'`): If `method` is `pushState` or `replaceState` — should current state be preserved or replaced with `null`. Default = `keep`
- `serialize`? (_(value: any) => string_): Custom serialize function.
- `deserialize`? (_(value: string) => any_): Custom deserialize function.
- `timeout`?: ([_number_]): Timeout in milliseconds, which will be used to throttle updates. Default = `undefined` (meaning updates will be applied immediately)
- `def`?: (_any_): Default value, which will be passed to `store`/`target` in case of absent query parameter. Default = `null`

## FAQ

### How do I use custom serialization / deserialization?

There are `serialize` and `deserialize` options for that. By default, they are _undefined_, meaning, that you should use plain string store `Store<string | null>`. But in some cases is is useful to use custom serialization, for example, to serialize number identifiers:

```typescript
import { persist } from 'effector-storage/query'

const $id = createStore<number | null>(null)

persist({
  store: $id,
  key: 'id',
  serialize: (id) => String(id),
  deserialize: (id) => Number(id),
})
```

Also, if you need some sort of serialization — you can use `.map` method for that. For deserialization you can use some snippets with `sample`, for example:

```javascript
import { persist } from 'effector-storage/query'

const $entity = createStore(null).on(
  fetchEntityFx.doneData,
  (_, entity) => entity
)

// ~ serialization down to plain `id`
const $id = $entity.map((entity) => `${entity.id}`)
persist({ store: $id, key: 'id' })

// in case of query string change -> fetch new entity by new id
sample({
  source: $id,
  target: fetchEntityFx,
})
```

[_store_]: https://effector.dev/docs/api/effector/store
[_function_]: https://developer.mozilla.org/en-US/docs/Glossary/Function
[_number_]: https://developer.mozilla.org/en-US/docs/Glossary/Number
