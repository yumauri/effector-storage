# (Experimental) Log adapter

[![bundlejs](https://deno.bundlejs.com/badge?q=effector-storage&treeshake=[{persist,log}]&config={%22esbuild%22:{%22external%22:[%22effector%22]}})](https://bundlejs.com/?q=effector-storage&treeshake=%5B%7Bpersist%2Clog%7D%5D&config=%7B%22esbuild%22%3A%7B%22external%22%3A%5B%22effector%22%5D%7D%7D)

Adapter, which does nothing, like `nil` adapter, but print messages. Useful for test purposes and when other storage options are not available and you want to see adapter messages.

🚧 This is an experimental adapter, and is subject to change in future releases. Do not rely on message format and argument of `logger` function, use it only for test and debug purposes.

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
