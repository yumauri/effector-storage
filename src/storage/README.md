# Generic synchronous storage adapter

Adapter to persist [_store_] in browser's [Storage].

## Usage

```javascript
import { persist } from 'effector-storage'
import { storage } from 'effector-storage/storage'

// persist store `$counter` in `localStorage` with key 'counter'
persist({
  adapter: storage({ storage: localStorage }),
  store: $counter,
  key: 'counter',
})
```

Two (or more) different stores, persisted with the same key, will be synchronized, even if not connected with each other directly — each store will receive updates from another one.

## Adapter

```javascript
import { storage } from 'effector-storage/storage'
```

- `storage(options): StorageAdapter`

### Options

- `storage` ([Storage]): Compatible synchronous storage.
- `sync`? ([_boolean_]): Add [`'storage'`] event listener or no. Default = `false`.
- `serialize`? (_(value: any) => string_): Custom serialize function. Default = `JSON.stringify`.
- `deserialize`? (_(value: string) => any_): Custom deserialize function. Default = `JSON.parse`.
- `def`?: (_any_): Default value, which will be passed to `store`/`target` in case of absent storage value. Default = `store.defaultState` or `null`.

[storage]: https://developer.mozilla.org/en-US/docs/Web/API/Storage
[`'storage'`]: https://developer.mozilla.org/en-US/docs/Web/API/StorageEvent
[_store_]: https://effector.dev/docs/api/effector/store
[_boolean_]: https://developer.mozilla.org/en-US/docs/Glossary/Boolean
