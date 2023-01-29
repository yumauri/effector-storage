# Generic asynchronous storage adapter

Adapter to persist [_store_] in compatible asynchronous storage.

## Usage

```javascript
import { persist, asyncStorage } from 'effector-storage'
import AsyncStorage from '@react-native-async-storage/async-storage'

// persist store `$counter` in `localStorage` with key 'counter'
persist({
  adapter: asyncStorage({ storage: () => AsyncStorage }),
  store: $counter,
  key: 'counter',
})
```

Two (or more) different stores, persisted with the same key, will be synchronized, even if not connected with each other directly — each store will receive updates from another one.

## Adapter

```javascript
import { asyncStorage } from 'effector-storage'
```

or

```javascript
import { asyncStorage } from 'effector-storage/async-storage'
```

- `storage(options): StorageAdapter`

### Options

- `storage` (_() => [AsyncStorage]_): Compatible asynchronous storage.
- `serialize`? (_(value: any) => string_): Custom serialize function. Default = `JSON.stringify`.
- `deserialize`? (_(value: string) => any_): Custom deserialize function. Default = `JSON.parse`.

[asyncstorage]: https://reactnative.dev/docs/asyncstorage
[_store_]: https://effector.dev/docs/api/effector/store
