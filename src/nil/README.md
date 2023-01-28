# Nil adapter

"Do nothing" adapter, useful for test purposes and when other storage options are not available.

## Usage

```javascript
import { persist } from 'effector-storage'
import { nil } from 'effector-storage/nil'

// persist store `$counter` with nil adapter == do nothing
persist({
  adapter: nil(),
  store: $counter,
  key: 'counter',
})
```

Note though, that two (or more) different stores, persisted with the same key and same `keyArea`, will be synchronized nonetheless, even if not connected with each other directly — each store will receive updates from another one.

`nil` is "no-op" adapter for [`either`](../tools/README.md#either) function.

## Adapter

```javascript
import { nil } from 'effector-storage/nil'
```

- `nil(keyArea?): StorageAdapter`

### Options

- `keyArea`? (any): Any value for adapter's key area. Default = `''`.
