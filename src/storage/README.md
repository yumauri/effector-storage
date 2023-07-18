# Generic synchronous storage adapter

[![bundlejs](https://deno.bundlejs.com/badge?q=effector-storage&treeshake=[{persist,storage}]&config={%22esbuild%22:{%22external%22:[%22effector%22]}})](https://bundlejs.com/?q=effector-storage&treeshake=%5B%7Bpersist%2Cstorage%7D%5D&config=%7B%22esbuild%22%3A%7B%22external%22%3A%5B%22effector%22%5D%7D%7D)

Adapter to persist [_store_] in browser's [Storage].

## Usage

```javascript
import { persist } from 'effector-storage'
import { storage } from 'effector-storage/storage'

// persist store `$counter` in `localStorage` with key 'counter'
persist({
  adapter: storage({ storage: () => localStorage }),
  store: $counter,
  key: 'counter',
})
```

Two (or more) different stores, persisted with the same key, will be synchronized, even if not connected with each other directly — each store will receive updates from another one.

## Adapter

```javascript
import { storage } from 'effector-storage'
```

or

```javascript
import { storage } from 'effector-storage/storage'
```

- `storage(options): StorageAdapter`

### Options

- `storage` (_() => [Storage]_): Compatible synchronous storage.
- `sync`? ([_boolean_] | 'force'): Add [`'storage'`] event listener or no. Default = `false`. In case of `'force'` value adapter will always read new value from _Storage_, instead of event.
- `serialize`? (_(value: any) => string_): Custom serialize function. Default = `JSON.stringify`.
- `deserialize`? (_(value: string) => any_): Custom deserialize function. Default = `JSON.parse`.
- `timeout`?: ([_number_]): Timeout in milliseconds, which will be used to throttle writes to _Storage_. Default = `undefined` (meaning updates will be set to the _Storage_ immediately)
- `def`?: (_any_): Default value, which will be passed to `store`/`target` in case of absent storage value. Default = `store.defaultState` or `null`.

[storage]: https://developer.mozilla.org/en-US/docs/Web/API/Storage
[`'storage'`]: https://developer.mozilla.org/en-US/docs/Web/API/StorageEvent
[_store_]: https://effector.dev/docs/api/effector/store
[_boolean_]: https://developer.mozilla.org/en-US/docs/Glossary/Boolean
[_number_]: https://developer.mozilla.org/en-US/docs/Glossary/Number
