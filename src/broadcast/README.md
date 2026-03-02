# (Experimental) `BroadcastChannel` adapter

[![bundlejs](https://deno.bundlejs.com/badge?q=effector-storage/broadcast&treeshake=[{persist}]&config={%22esbuild%22:{%22external%22:[%22effector%22]}})](https://bundlejs.com/?q=effector-storage%2Fbroadcast&treeshake=%5B%7Bpersist%7D%5D&config=%7B%22esbuild%22%3A%7B%22external%22%3A%5B%22effector%22%5D%7D%7D)

Adapter to sync [_store_]s across different [browsing contexts](https://developer.mozilla.org/en-US/docs/Glossary/Browsing_context) of a given [origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin), using [`BroadcastChannel`] API.

Long story short, using this adapter you can synchronize stores in different tabs of the same website, or between tabs and [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Worker), or [Shared Workers](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker), or [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API), without actually persisting store value anywhere aside from memory.

Usually, to sync stores between tabs, developers use `localStorage`. But if you have some secret in a store that you do not want to write to a publicly accessible place (like, well, `localStorage`), you might want to try this adapter instead.

🚧 This is an experimental adapter. While its logic fits the adapter implementation well and works great, in the future it might be deprecated in favor of some kind of "invalidate channel" feature. The only purpose of this adapter is to synchronize stores across different contexts, and it may end up as something other than an adapter.

## Usage

Import `persist` function from `'effector-storage/broadcast'` module, and it will just work:

```javascript
import { persist } from 'effector-storage/broadcast'

// sync store `$counter` between different contexts with key 'counter'
persist({ store: $counter, key: 'counter' })

// if your storage has a name, you can omit `key` field
persist({ store: $counter })
```

## Formulae

```javascript
import { persist } from 'effector-storage/broadcast'
```

- `persist({ store, ...options }): Subscription`
- `persist({ source, target, ...options }): Subscription`

### Options

- ... all the [common options](../../README.md#options) from root `persist` function.
- `channel`?: ([_string_]): Name of the `BroadcastChannel` to use. Default = `'effector-storage'`.

## Adapter

```javascript
import { broadcast } from 'effector-storage'
```

or

```javascript
import { broadcast } from 'effector-storage/broadcast'
```

- `broadcast(options?): StorageAdapter`

### Options

- `channel`?: ([_string_]): Name of the `BroadcastChannel` to use. Default = `'effector-storage'`.

## Gotchas

If your stores are updated _very_ frequently, you might encounter a desynchronization issue, aka a _race condition_. Check issue [#32](https://github.com/yumauri/effector-storage/issues/32) for more details. That issue is related to `localStorage`, but the mechanism is the same here: stores are updated by a [`'message'`] event fired by `BroadcastChannel`. But unlike `localStorage`, there is no _medium_ that always contains actual data as a source of truth, so this problem cannot be solved easily.

## FAQ

### How do I use custom serialization / deserialization?

You don't need to! `BroadcastChannel` can transfer any structured-clonable data.

[_store_]: https://effector.dev/docs/api/effector/store
[`broadcastchannel`]: https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel
[`'message'`]: https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel/message_event
[_string_]: https://developer.mozilla.org/en-US/docs/Glossary/String
