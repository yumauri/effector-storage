# (Experimental) Log adapter

Adapter, which does nothing, like `nil` adapter, but print messages. Useful for test purposes and when other storage options are not available and you want to see adapter messages.

⚠️ Experimental, subject to change in future releases. Do not rely on message format and argument of `logger` function, use it only for test and debug purposes.

## Usage

```javascript
import { persist, log } from 'effector-storage'

// persist store `$counter` with log adapter == do nothing + print messages
persist({
  adapter: log,
  store: $counter,
  key: 'counter',
})
```

Note though, that two (or more) different stores, persisted with the same key and same `keyArea`, will be synchronized nonetheless, even if not connected with each other directly — each store will receive updates from another one.

`log` is "no-op" adapter for [`either`](../tools/README.md#either) function.

## Adapter

```javascript
import { log } from 'effector-storage'
```

or

```javascript
import { log } from 'effector-storage/log'
```

- `log({ keyArea?, logger? }?): StorageAdapter`

### Options

- `keyArea`? (any): Any value for adapter's key area. Default = `''`.
- `logger`? (_(message: string) => void_): Logger to print messages. Default = `console.log`.
