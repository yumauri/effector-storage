# effector-storage

[![Build Status](https://github.com/yumauri/effector-storage/workflows/build/badge.svg)](https://github.com/yumauri/effector-storage/actions?workflow=build)
[![License](https://img.shields.io/github/license/yumauri/effector-storage.svg?color=yellow)](./LICENSE)
[![NPM](https://img.shields.io/npm/v/effector-storage.svg)](https://www.npmjs.com/package/effector-storage)
![Made with Love](https://img.shields.io/badge/made%20with-❤-red.svg)

Small module for [Effector](https://github.com/effector/effector) ☄️ to sync stores with different storages (local storage, session storage, async storage, IndexedDB, cookies, server side storage, etc).

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Install](#install)
- [Usage](#usage)
  - [with `localStorage`](#with-localstorage)
  - [with `sessionStorage`](#with-sessionstorage)
  - [with query string](#with-query-string)
  - [with React Native AsyncStorage](#with-react-native-asyncstorage)
  - [with React Native EncryptedStorage](#with-react-native-encryptedstorage)
- [Usage with domains](#usage-with-domains)
- [Functional helpers](#functional-helpers)
- [Formulae](#formulae)
  - [Units](#units)
  - [Options](#options)
  - [Returns](#returns)
- [`createPersist` factory](#createpersist-factory)
  - [Options](#options-1)
  - [Returns](#returns-1)
- [Advanced usage](#advanced-usage)
- [Storage adapters](#storage-adapters)
  - [Synchronous storage adapter example](#synchronous-storage-adapter-example)
  - [Asynchronous storage adapter example](#asynchronous-storage-adapter-example)
  - [Storage with external updates example](#storage-with-external-updates-example)
  - [Update from non-reactive storage](#update-from-non-reactive-storage)
  - [Local storage adapter with values expiration](#local-storage-adapter-with-values-expiration)
  - [Custom `Storage` adapter](#custom-storage-adapter)
- [FAQ](#faq)
  - [Can I persist part of the store?](#can-i-persist-part-of-the-store)
- [TODO](#todo)
- [Sponsored](#sponsored)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Install

Depending on your package manager

```bash
# using `pnpm` ↓
$ pnpm add effector-storage

# using `yarn` ↓
$ yarn add effector-storage

# using `npm` ↓
$ npm install --save effector-storage
```

## Usage

### with `localStorage`

Docs: [effector-storage/local](https://github.com/yumauri/effector-storage/tree/master/src/local/README.md)

```javascript
import { persist } from 'effector-storage/local'

// persist store `$counter` in `localStorage` with key 'counter'
persist({ store: $counter, key: 'counter' })

// if your storage has a name, you can omit `key` field
persist({ store: $counter })
```

Stores, persisted in `localStorage`, are automatically synced between two (or more) windows/tabs. Also, they are synced between instances, so if you will persist two stores with the same key — each store will receive updates from another one.

### with `sessionStorage`

Docs: [effector-storage/session](https://github.com/yumauri/effector-storage/tree/master/src/session/README.md)

Same as above, just import `persist` from `'effector-storage/session'`:

```javascript
import { persist } from 'effector-storage/session'
```

Stores, persisted in `sessionStorage`, are synced between instances, but not between different windows/tabs.

### with query string

Docs: [effector-storage/query](https://github.com/yumauri/effector-storage/tree/master/src/query/README.md)

You can _reflect_ plain string store value in query string parameter, using this adapter. Think of it like about synchronizing store value and query string parameter.

```javascript
import { persist } from 'effector-storage/query'

// persist store `$id` in query string parameter 'id'
persist({ store: $id, key: 'id' })
```

If two (or more) stores are persisted in query string with the same key — they are synced between themselves.

⚠️ **Note**<br>
Use this only with plain string stores (`Store<string | null>`) to avoid strange unexpected behavior.

### with React Native AsyncStorage

Docs: [effector-storage/rn/async](https://github.com/yumauri/effector-storage/tree/master/src/rn/async/README.md)

```javascript
import { persist } from 'effector-storage/rn/async'

// persist store `$counter` with key 'counter'
persist({ store: $counter, key: 'counter' })

// if your storage has a name, you can omit `key` field
persist({ store: $counter })
```

⚠️ Note, that [AsyncStorage] is asynchronous, hence the name.

### with React Native EncryptedStorage

Docs: [effector-storage/rn/encrypted](https://github.com/yumauri/effector-storage/tree/master/src/rn/encrypted/README.md)

```javascript
import { persist } from 'effector-storage/rn/encrypted'

// persist store `$counter` with key 'counter'
persist({ store: $counter, key: 'counter' })

// if your storage has a name, you can omit `key` field
persist({ store: $counter })
```

⚠️ Note, that [EncryptedStorage] is asynchronous (it is based on [AsyncStorage] actually).

## Usage with domains

You can use `persist` inside Domain's `onCreateStore` hook:

```javascript
import { createDomain } from 'effector'
import { persist } from 'effector-storage/local'

const app = createDomain('app')

// this hook will persist every store, created in domain,
// in `localStorage`, using stores' names as keys
app.onCreateStore((store) => persist({ store }))

const $store = app.createStore(0, { name: 'store' })
```

## Formulae

```javascript
import { persist } from 'effector-storage/<adapter>'
```

- `persist({ store, ...options }): Subscription`
- `persist({ source, target, ...options }): Subscription`

### Units

In order to synchronize _something_, you need to specify effector units. Depending on a requirements, you may want to use `store` parameter, or `source` and `target` parameters:

- `store` ([_Store_]): Store to synchronize with local/session storage.
- `source` ([_Event_] | [_Effect_] | [_Store_]): Source unit, which updates will be sent to local/session storage.
- `target` ([_Event_] | [_Effect_] | [_Store_]): Target unit, which will receive updates from local/session storage (as well as initial value). Must be different than `source` to avoid circular updates — `source` updates are forwarded directly to `target`.

### Options

- `key`? ([_string_]): Key for local/session storage, to store value in. If omitted — `store` name is used. **Note!** If `key` is not specified, `store` _must_ have a `name`! You can use `'effector/babel-plugin'` to have those names automatically.
- `keyPrefix`? ([_string_]): Prefix, used in adapter, to be concatenated to `key`. By default = `''`.
- `clock`? ([_Event_] | [_Effect_] | [_Store_]): Unit, if passed – then value from `store`/`source` will be stored in the storage only upon its trigger.
- `pickup`? ([_Event_] | [_Effect_] | [_Store_]): Unit, which you can specify to update `store` value from storage. **Note!** When you add `pickup`, `persist` _will not_ get initial value from storage automatically!
- `done`? ([_Event_] | [_Effect_] | [_Store_]): Unit, which will be triggered on each successful read or write from/to storage.<br>
  Payload structure:
  - `key` ([_string_]): Same `key` as above.
  - `keyPrefix` ([_string_]): Prefix, used in adapter, to be concatenated to `key`. By default = `''`.
  - `operation` (_`'set'`_ | _`'get'`_): Type of operation, read (get) or write (set).
  - `value` (_State_): Value set to `store` or got from `store`.
- `fail`? ([_Event_] | [_Effect_] | [_Store_]): Unit, which will be triggered in case of any error (serialization/deserialization error, storage is full and so on). **Note!** If `fail` unit is not specified, any errors will be printed using `console.error(Error)`.<br>
  Payload structure:
  - `key` ([_string_]): Same `key` as above.
  - `keyPrefix` ([_string_]): Prefix, used in adapter, to be concatenated to `key`. By default = `''`.
  - `operation` (_`'set'`_ | _`'get'`_): Type of operation, read (get) or write (set).
  - `error` ([_Error_]): Error instance
  - `value`? (_any_): In case of _'set'_ operation — value from `store`. In case of _'get'_ operation could contain raw value from storage or could be empty.
- `finally`? ([_Event_] | [_Effect_] | [_Store_]): Unit, which will be triggered either in case of success or error.<br>
  Payload structure:
  - `key` ([_string_]): Same `key` as above.
  - `keyPrefix` ([_string_]): Prefix, used in adapter, to be concatenated to `key`. By default = `''`.
  - `operation` (_`'set'`_ | _`'get'`_): Type of operation, read (get) or write (set).
  - `status` (_`'done'`_ | _`'fail'`_): Operation status.
  - `error`? ([_Error_]): Error instance, in case of error.
  - `value`? (_any_): Value, in case it is exists (look above).

### Returns

- ([_Subscription_]): You can use this subscription to remove store association with storage, if you don't need them to be synced anymore. It is a function.

## `createPersist` factory

In rare cases you might want to use `createPersist` factory. It allows you to specify some adapter options, like `keyPrefix`.

```javascript
import { createPersist } from 'effector-storage/local'

const persist = createPersist({
  keyPrefix: 'app/',
})

// ---8<---

persist({
  store: $store1,
  key: 'store1', // localStorage key will be `app/store1`
})
persist({
  store: $store2,
  key: 'store2', // localStorage key will be `app/store2`
})
```

### Options

- `keyPrefix`? ([_string_]): Key prefix for adapter. It will be concatenated with any `key`, given to returned `persist` function.

### Returns

- Custom `persist` function, with predefined adapter options.

## Advanced usage

`effector-storage` consists of a _core_ module and _adapter_ modules.

The core module itself does nothing with actual storage, it just connects effector units to the storage adapter, using two _Effects_ and bunch of _forwards_.

The storage adapter _gets_ and _sets_ values, and also can asynchronously emit values on storage updates.

```javascript
import { persist } from 'effector-storage'
```

Core function `persist` accepts all **common** options, as `persist` functions from sub-modules, plus additional one:

- `adapter` (_StorageAdapter_): Storage adapter to use.

## Storage adapters

Adapter is a function, which is called by the core `persist` function, and has following interface:

```typescript
interface StorageAdapter {
  <State>(key: string, update: (raw?: any) => any): {
    get(raw?: any): State | Promise<State>
    set(value: State): void
  }
  keyArea?: any
}
```

#### Arguments

- `key` ([_string_]): Unique key to distinguish values in storage.
- `update` ([_Function_]): Function, which could be called to get value from storage. In fact this is `Effect` with `get` function as a handler. In other words, any argument, passed to `update` function, will end up as argument in `get` function.

#### Returns

- `{ get, set }` (_{ Function, Function }_): Getter from and setter to storage. These functions are used as Effects handlers, and could be sync or async. Also, you don't have to catch exceptions and errors inside those functions — Effects will do that for you.<br>
  As mentioned above, call of `update` function will trigger `get` function with the same argument. So you can handle cases, when `get` function is called during initial `persist` execution (without arguments), or after external update. Check out [example below](#storage-with-external-updates-example).

#### keyArea

Adapter function can have static field `keyArea` — this could be any value of any type, which should be unique for _keys namespace_. For example, two local storage adapters could have different settings, but both of them uses same _storage area_ — `localStorage`. So, different stores, persisted in local storage with the same key (but possibly with different adapters), should be synced. That is what `keyArea` is responsible for. Value of that field is used as a key in cache `Map`.<br>
In case it is omitted — adapter instances is used instead.

### Synchronous storage adapter example

For example, simplified _localStorage_ adapter might looks like this. This is over-simplified example, don't do that in real code, there are no serialization and deserialization, no checks for edge cases. This is just to show an idea.

```javascript
import { createStore } from 'effector'
import { persist } from 'effector-storage'

const adapter = (key) => ({
  get: () => localStorage.getItem(key),
  set: (value) => localStorage.setItem(key, value),
})

const store = createStore('', { name: 'store' })
persist({ store, adapter }) // <- use adapter
```

### Asynchronous storage adapter example

Using asynchronous storage is just as simple. Once again, this is just a bare simple idea, without serialization and edge cases checks.

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createStore } from 'effector'
import { persist } from 'effector-storage'

const adapter = (key) => ({
  get: async () => AsyncStorage.getItem(key),
  set: async (value) => AsyncStorage.setItem(key, value),
})

const store = createStore('', { name: '@store' })
persist({ store, adapter }) // <- use adapter
```

### Storage with external updates example

If your storage can be updated from an _external source_, then adapter needs a way to inform/update connected store. That is where you will need second `update` argument.

```javascript
import { createStore } from 'effector'
import { persist } from 'effector-storage'

const adapter = (key, update) => {
  addEventListener('storage', (event) => {
    if (event.key === key) {
      // kick update
      // this will call `get` function from below ↓
      // wrapped in Effect, to handle any errors
      update(event.newValue)
    }
  })

  return {
    // `get` function will receive `newValue` argument
    // from `update`, called above ↑
    get: (newValue) => newValue || localStorage.getItem(key),
    set: (value) => localStorage.setItem(key, value),
  }
}

const store = createStore('', { name: 'store' })
persist({ store, adapter }) // <- use adapter
```

### Update from non-reactive storage

If your storage can be updated from _external source_, and doesn't have any events to react to, but you are able to know about it somehow.

You can use optional `pickup` parameter to specify unit to trigger update (keep in mind, that when you add `pickup`, `persist` _will not_ get initial value from storage automatically):

```javascript
import { createEvent, createStore, forward } from 'effector'
import { persist } from 'effector-storage/session'

// event, which will be used to trigger update
const pickup = createEvent()

const store = createStore('', { name: 'store' })
persist({ store, pickup }) // <- set `pickup` parameter

// --8<--

// when you are sure, that storage was updated,
// and you need to update `store` from storage with new value
pickup()
```

Another option, if you have your own adapter, you can add this feature right into it:

```javascript
import { createEvent, createStore, forward } from 'effector'
import { persist } from 'effector-storage'

// event, which will be used in adapter to react to
const pickup = createEvent()

const adapter = (key, update) => {
  // if `pickup` event was triggered -> trigger `update`
  // this will call `get` function from below ↓
  // wrapped in Effect, to handle any errors
  forward({ from: pickup, to: update })
  return {
    get: () => localStorage.getItem(key),
    set: (value) => localStorage.setItem(key, value),
  }
}

const store = createStore('', { name: 'store' })
persist({ store, adapter }) // <- use your adapter

// --8<--

// when you are sure, that storage was updated,
// and you need to force update `store` from storage with new value
pickup()
```

### Local storage adapter with values expiration

> I want sync my store with `localStorage`, but I need smart synchronization, not dumb. Each storage update should contain last write timestamp. And on read value I need to check if value has been expired, and fill store with default value in that case.

You can implement it with custom adapter, something like this:

```javascript
import { createStore } from 'effector'
import { persist } from 'effector-storage'

const adapter = (timeout) => (key) => ({
  get() {
    const item = localStorage.getItem(key)
    if (item === null) return // no value in localStorage
    const { time, value } = JSON.parse(item)
    if (time + timeout * 1000 < Date.now()) return // value has expired
    return value
  },

  set(value) {
    localStorage.setItem(key, JSON.stringify({ time: Date.now(), value }))
  },
})

const store = createStore('', { name: 'store' })

// use adapter with timeout = 1 hour ↓↓↓
persist({ store, adapter: adapter(3600) })
```

### Custom `Storage` adapter

Both `'effector-storage/local'` and `'effector-storage/session'` are using common `storage` adapter factory. If you want to use _other storage_, which implements [`Storage`](https://developer.mozilla.org/en-US/docs/Web/API/Storage) interface (in fact, synchronous `getItem` and `setItem` methods are enough) — you can use this factory.

```javascript
import { storage } from 'effector-storage/storage'
```

```javascript
adapter = storage(options)
```

#### Options

- `storage` (_Storage_): Storage to communicate with.
- `sync`? ([_boolean_]): Add [`'storage'`] event listener or no. Default = `false`.
- `serialize`? (_(value: any) => string_): Custom serialize function. Default = `JSON.stringify`
- `deserialize`? (_(value: string) => any_): Custom deserialize function. Default = `JSON.parse`

#### Returns

- (StorageAdapter): Storage adapter, which can be used with the core `persist` function.

## FAQ

### Can I persist part of the store?

The issue here is that it is hardly possible to create universal mapping to/from storage to the part of the store within the library implementation. But with `persist` form with `source`/`target`, and little help of Effector API you can make it:

```javascript
import { persist } from 'effector-storage/local'

const setX = createEvent()
const setY = createEvent()
const $coords = createStore({ x: 123, y: 321 })
  .on(setX, ({ y }, x) => ({ x, y }))
  .on(setY, ({ x }, y) => ({ x, y }))

// persist X coordinate in `localStorage` with key 'x'
persist({
  source: $coords.map(({ x }) => x),
  target: setX,
  key: 'x',
})

// persist Y coordinate in `localStorage` with key 'y'
persist({
  source: $coords.map(({ y }) => y),
  target: setY,
  key: 'y',
})
```

⚠️ **BIG WARNING!**<br>
Use this approach with caution, beware of infinite circular updates. To avoid them, persist _only plain values_ in storage. So, mapped store in `source` will not trigger update, if object in original store has changed. Also, you can take a look at [`updateFilter` option](https://effector.dev/docs/api/effector/createStore).

## TODO

- [x] [localStorage] support (docs: [effector-storage/local](https://github.com/yumauri/effector-storage/tree/master/src/local/README.md))
- [x] [sessionStorage] support (docs: [effector-storage/session](https://github.com/yumauri/effector-storage/tree/master/src/session/README.md))
- [x] [query string](https://developer.mozilla.org/en-US/docs/Web/API/Location/search) support (docs: [effector-storage/query](https://github.com/yumauri/effector-storage/tree/master/src/query/README.md))
- [x] [AsyncStorage] support (docs: [effector-storage/rn/async](https://github.com/yumauri/effector-storage/tree/master/src/rn/async/README.md))
- [x] [EncryptedStorage] support (docs: [effector-storage/rn/encrypted](https://github.com/yumauri/effector-storage/tree/master/src/rn/encrypted/README.md))
- [ ] [IndexedDB] support
- [ ] [Cookies] support
- [ ] you name it support

## Sponsored

[<img src="https://setplex.com/img/logo.png" alt="Setplex OTT Platform" width="236">](https://setplex.com/en/)

[Setplex OTT Platform](https://setplex.com/en/)

[localstorage]: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
[sessionstorage]: https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
[`'storage'`]: https://developer.mozilla.org/en-US/docs/Web/API/StorageEvent
[indexeddb]: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
[asyncstorage]: https://react-native-async-storage.github.io/async-storage/
[encryptedstorage]: https://github.com/emeraldsanto/react-native-encrypted-storage
[cookies]: https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie
[_subscription_]: https://effector.dev/docs/glossary#subscription
[_effect_]: https://effector.dev/docs/api/effector/effect
[_event_]: https://effector.dev/docs/api/effector/event
[_store_]: https://effector.dev/docs/api/effector/store
[_string_]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
[_function_]: https://developer.mozilla.org/en-US/docs/Glossary/Function
[_boolean_]: https://developer.mozilla.org/en-US/docs/Glossary/Boolean
[_error_]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
