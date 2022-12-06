# React Native AsyncStorage adapter

Adapter to persist [_store_] using React Native [AsyncStorage].

## Preconditions

Install [AsyncStorage], following [documentation](https://react-native-async-storage.github.io/async-storage/docs/install) for your platform.

⚠️ `effector-storage` doesn't have AsyncStorage as dependencies, nor peer dependencies. It **will not** install AsyncStorage automatically.

## Usage

Import `persist` function from `'effector-storage/rn/async'` module, and it will just work:

```javascript
import { persist } from 'effector-storage/rn/async'

// persist store `$counter` with key 'counter'
persist({ store: $counter, key: 'counter' })

// if your storage has a name, you can omit `key` field
persist({ store: $counter })
```

⚠️ Note, that AsyncStorage is asynchronous, hence the name.

Two (or more) different stores, persisted with the same key, will be synchronized (_synchronously!_), even if not connected with each other directly — each store will receive updates from another one.

## Formulae

```javascript
import { persist } from 'effector-storage/rn/async'
```

- `persist({ store, ...options }): Subscription`
- `persist({ source, target, ...options }): Subscription`

### Options

- ... all the [common options](../../../README.md#options) from root `persist` function.
- `serialize`? (_(value: any) => string_): Custom serialize function. Default = `JSON.stringify`.
- `deserialize`? (_(value: string) => any_): Custom deserialize function. Default = `JSON.parse`.

## Adapter

```javascript
import { async } from 'effector-storage/rn/async'
```

- `async(options?): StorageAdapter`

### Options

- `serialize`? (_(value: any) => string_): Custom serialize function. Default = `JSON.stringify`.
- `deserialize`? (_(value: string) => any_): Custom deserialize function. Default = `JSON.parse`.

## FAQ

### How do I use custom serialization / deserialization?

Options `serialize` and `deserialize` are got you covered. But make sure, that serialization is stable, meaning, that `deserialize(serialize(object))` is equal to `object` (or `serialize(deserialize(serialize(object))) === serialize(object)`):

```javascript
import { persist } from 'effector-storage/rn/async'

const $date = createStore(new Date(), { name: 'date' })

persist({
  store: $date,
  serialize: (date) => String(date.getTime()),
  deserialize: (timestamp) => new Date(Number(timestamp)),
})
```

[asyncstorage]: https://react-native-async-storage.github.io/async-storage/
[_subscription_]: https://effector.dev/docs/glossary#subscription
[_store_]: https://effector.dev/docs/api/effector/store
