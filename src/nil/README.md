# Nil adapter

[![bundlejs](https://deno.bundlejs.com/badge?q=effector-storage&treeshake=[{persist,nil}]&config={%22esbuild%22:{%22external%22:[%22effector%22]}})](https://bundlejs.com/?q=effector-storage&treeshake=%5B%7Bpersist%2Cnil%7D%5D&config=%7B%22esbuild%22%3A%7B%22external%22%3A%5B%22effector%22%5D%7D%7D)

"Do nothing" adapter, useful for test purposes and when other storage options are not available.

## Usage

```javascript
import { persist, nil } from 'effector-storage'

// persist store `$counter` with nil adapter == do nothing
persist({
  adapter: nil,
  store: $counter,
  key: 'counter',
})
```

Note though, that two (or more) different stores, persisted with the same key and same `keyArea`, will be synchronized nonetheless, even if not connected with each other directly — each store will receive updates from another one.

`nil` is "no-op" adapter for [`either`](../tools/README.md#either) function.

## Adapter

```javascript
import { nil } from 'effector-storage'
```

or

```javascript
import { nil } from 'effector-storage/nil'
```

- `nil({ keyArea? }?): StorageAdapter`

### Options

- `keyArea`? (any): Any value for adapter's key area. Default = `''`.
