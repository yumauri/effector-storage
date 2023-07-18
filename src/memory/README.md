# Memory adapter

[![bundlejs](https://deno.bundlejs.com/badge?q=effector-storage/memory&treeshake=[{persist}]&config={%22esbuild%22:{%22external%22:[%22effector%22]}})](https://bundlejs.com/?q=effector-storage%2Fmemory&treeshake=%5B%7Bpersist%7D%5D&config=%7B%22esbuild%22%3A%7B%22external%22%3A%5B%22effector%22%5D%7D%7D)

Adapter to persist [_store_] in memory. Useful for testing purposes and when other storage options are not available.

## Usage

Import `persist` function from `'effector-storage/memory'` module, and it will just work:

```javascript
import { persist } from 'effector-storage/memory'

// persist store `$counter` with key 'counter'
persist({ store: $counter, key: 'counter' })

// if your storage has a name, you can omit `key` field
persist({ store: $counter })
```

Two (or more) different stores, persisted with the same key, will be synchronized, even if not connected with each other directly — each store will receive updates from another one.

## Formulae

```javascript
import { persist } from 'effector-storage/memory'
```

- `persist({ store, ...options }): Subscription`
- `persist({ source, target, ...options }): Subscription`

### Options

- ... all the [common options](../../README.md#options) from root `persist` function.

## Adapter

```javascript
import { memory } from 'effector-storage'
```

or

```javascript
import { memory } from 'effector-storage/memory'
```

- `memory({ area? }?): StorageAdapter`

### Options

- `area`? ([_Map_]_<string, any>_): Map to store values. Default = common global map.

[_subscription_]: https://effector.dev/docs/glossary#subscription
[_store_]: https://effector.dev/docs/api/effector/store
[_map_]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
