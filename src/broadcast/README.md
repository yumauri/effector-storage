# (Experimental) `BroadcastChannel` adapter

Adapter to sync [_store_]s across different [browsing contexts](https://developer.mozilla.org/en-US/docs/Glossary/Browsing_context) of a given [origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin), using [`BroadcastChannel`] API.

Long story short, using this adapter you can synchronize stores in different tabs of the same website, or between tabs and [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Worker), or [Shared Workers](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker), or [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API), without actually persisting store value anywhere aside from memory.

Usually to sync stores between tabs, developers uses a `localStorage`, but in case you have some secret in store, which you don't want to write to a publicly accessible place (like, well, the `localStorage`), you might want to try this adapter instead.

🚧 This is an experimental adapter. While its logic fits excellent into adapter implementation, and it works pretty awesome, in the future it might be deprecated in favor of some kind of "invalidate channel" feature. The only purpose of this adapter is to synchronize stores across different contexts, and it looks like some other kind of things, not adapter entirely.

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

If your stores are _very_ frequently updated, you might encounter with desynchronization issue, aka _race condition_. Check issue [#32](https://github.com/yumauri/effector-storage/issues/32) for more details. This issue is related to the `localStorage`, but working mechanism is the same — stores got updated by an event [`'message'`], fired by the `BroadcastChannel`. But in contrary with the `localStorage`, there is no any _medium_, which always contains actual data, like "source of truth", so, it is impossible to solve this problem easily, alas...

## FAQ

### How do I use custom serialization / deserialization?

You don't need to! `BroadcastChannel` can transfer any structured-clonable data.

[_store_]: https://effector.dev/docs/api/effector/store
[`broadcastchannel`]: https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel
[`'message'`]: https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel/message_event
[_string_]: https://developer.mozilla.org/en-US/docs/Glossary/String
