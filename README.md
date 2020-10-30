# effector-storage

[![Build Status](https://github.com/yumauri/effector-storage/workflows/build/badge.svg)](https://github.com/yumauri/effector-storage/actions?workflow=build)
[![License](https://img.shields.io/github/license/yumauri/effector-storage.svg?color=yellow)](./LICENSE)
[![NPM](https://img.shields.io/npm/v/effector-storage.svg)](https://www.npmjs.com/package/effector-storage)
![Made with Love](https://img.shields.io/badge/made%20with-❤-red.svg)

Small module for [Effector](https://github.com/effector/effector) ☄️ to sync stores with different storages (local storage, session storage, async storage, IndexedDB, cookies, server side storage, etc).

## Table of Contents

<!-- npx markdown-toc README.md -->

- [Install](#install)
- [Simple usage](#simple-usage)
  - [with `localStorage`](#with-localstorage)
  - [with `sessionStorage`](#with-sessionstorage)
- [Usage with domains](#usage-with-domains)
- [FP helpers](#fp-helpers)
- [Options](#options)
- [Advanced usage](#advanced-usage)
- [Storage adapters](#storage-adapters)
- [FAQ](#faq)
  - [Can I use custom serialization / deserialization?](#can-i-use-custom-serialization--deserialization)
  - [Can I persist part of the store?](#can-i-persist-part-of-the-store)
- [TODO](#todo)
- [Sponsored](#sponsored)

## Install

```bash
$ yarn add effector-storage@next
```

Or using `npm`

```bash
$ npm install --save effector-storage@next
```

## Simple usage

### with [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

```javascript
import { persist } from 'effector-storage/local'

// persist store `$counter` in `localStorage` with key 'counter'
persist({ store: $counter, key: 'counter' })

// if your storage has a name, you can omit `key` field
persist({ store: $counter })
```

Stores, persisted in `localStorage`, are automatically synced between two (or more) windows/tabs. Also, they are synced between instances, so if you will persist two stores with the same key — each store will receive updates from another one.

### with [sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)

Same as above, just import `persist` from `'effector-storage/session'`:

```javascript
import { persist } from 'effector-storage/session'
```

Stores, persisted in `sessionStorage`, are synced between instances, but not between different windows/tabs.

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

## FP helpers

There are special `persist` forms to use with functional programming style. You can use them, if you like, with Domain hook or `.thru()` store method:

```javascript
import { createDomain } from 'effector'
import { persist } from 'effector-storage/local/fp'

const app = createDomain('app')

// this hook will persist every store, created in domain,
// in `localStorage`, using stores' names as keys
app.onCreateStore(persist())

const $store = app.createStore(0, { name: 'store' })

// or persist single store in `localStorage` via .thru
const $counter = createStore(0)
  .on(increment, (state) => state + 1)
  .on(decrement, (state) => state - 1)
  .reset(resetCounter)
  .thru(persist({ key: 'counter' }))
```

## Options

Both

```javascript
import { persist } from 'effector-storage/local'
import { persist } from 'effector-storage/session'
```

has two forms:

```javascript
persist({ store, key?, fail? }): Subscription
persist({ source, target, key?, fail? }): Subscription
```

### Arguments

- `store` (_Store_): Store to synchronize with local/session storage.
- `source` (_Event_ | _Effect_ | _Store_): Source unit, which updates will be sent to local/session storage.
- `target` (_Event_ | _Effect_ | _Store_): Target unit, which will receive updates from local/session storage (as well as initial value). Must be different than `source` to avoid circular updates — `source` updates are forwarded directly to `target`.
- `key`? (_string_): Key for local/session storage, to store value in. If omitted — `store`/`source` name is used. **Note!** If `key` is not specified, store/source _must_ have a `name`! You can use `'effector/babel-plugin'` to have those names automatically.
- `fail`? (_Event_ | _Effect_ | _Store_): Unit, which will be triggered in case of any error (serialization/deserialization error, storage is full and so on). **Note!** If `fail` unit is not specified, any errors will be printed using `console.error(Error)`.<br>
  Payload structure:
  - `key` (_string_): Same `key` as above.
  - `operation` (_'set'_ | _'get'_): Did error occurs during setting value to storage or getting value from storage.
  - `error` (_Error_): Error instance
  - `value`? (_any_): In case of _'set'_ operation — value from `store`/`source`. In case of _'get'_ operation could contain raw value from storage or could be empty.

### Returns

- (Subscription): You can use this subscription to remove store/source/target association with local/session storage, if you don't need them to be synced anymore.

Both _fp_

```javascript
import { persist } from 'effector-storage/local/fp'
import { persist } from 'effector-storage/session/fp'
```

has one form:

```javascript
persist({ key?, fail? }?): (store) => Store
```

### Arguments

- Same as above, also `persist` could be called without arguments at all.

### Returns

- (Store): Same given store. _You cannot unsubscribe store from storage when using fp forms of `persist`._

## Advanced usage

`effector-storage` consists of a _core_ module and _adapter_ modules.

The core module itself does nothing with actual storage, it just connects effector units to the storage adapter, using two _Effects_ and bunch of _forwards_.

The storage adapter _gets_ and _sets_ values, and also can asynchronously emit values on storage updates.

```javascript
import { persist } from 'effector-storage'
```

Core function `persist` accepts all the same parameters, as `persist` functions from sub-modules, plus additional one:

- `with` (_StorageAdapter_): Storage adapter to use.

There is also _fp_ form:

```javascript
import { persist } from 'effector-storage/fp'
```

## Storage adapters

Adapter is a function, which is called by core `persist` function, and has following interface:

```typescript
export interface StorageAdapter {
  <State>(key: string, update: (raw?: any) => any): {
    set(value: State): void
    get(value?: any): State | Promise<State>
  }
}
```

### Arguments

- `key` (_string_): Unique key to distinguish values in storage
- `update` (_Function_): Function, which could be called to get value from storage. In fact this is `Effect`, but for adapter this is not important, really.

### Returns

- `{ set, get }` (_{ Function, Function }_): Setter to storage and getter from storage. These functions are used as Effects handlers, and could be sync or async. Also, you don't have to catch exceptions and errors inside those functions — Effects will do that for you.

For example, simplified _localStorage_ adapter might looks like this:

```javascript
// This is over-simplified example, don't do that in real code :)
// There is no serialization and deserialization
// No checks for edge cases
// But to show an idea - this should fit
const localStorageAdapter = (key) => ({
  get: () => localStorage.getItem(key),
  set: (value) => localStorage.setItem(key, value),
})
```

and later you could use this adapter with core `persist` function:

```javascript
import { createStore } from 'effector'
import { persist } from 'effector-storage'

const store = createStore('', { name: 'store' })
persist({ store, with: localStorageAdapter }) // <- use adapter
```

Using that approach, it is possible to implement adapters to any "storage": local storage (_already_), session storage (_already_), async storage, IndexedDB, cookies, server side storage, you name it.

## FAQ

### Can I use custom serialization / deserialization?

Out of the box, `persist` function from `effector-storage/local` and `effector-storage/session` doesn't support custom serialization (as well as both _fp_ forms). But fear not! You can use _internal_ `storage` adapter factory, which has this functionality:

```javascript
import { persist } from 'effector-storage'
import { storage } from 'effector-storage/storage'

const adapter = storage(
  // first argument stands for `Storage` instance
  localStorage,

  // second argument stands for synchronization between windows/tabs
  true,

  // serialization function (by default `JSON.stringify`)
  (date) => String(date.getTime()),

  // deserialization function (by default `JSON.parse`)
  (timestamp) => new Date(Number(timestamp))
)

const date$ = createStore(new Date(), { name: 'date' })
persist({ store: date$, with: adapter })
```

In fact, this factory is used by `effector-storage/local` and `effector-storage/session` both. Of course, you can also make your own adapter from scratch with any logic you want.

### Can I persist part of the store?

The issue here is that it is hardly possible to create universal mapping to/from storage to the part of the store within the library implementation. But with `persist` form with `source`/`target`, and little help of Effector API you can make it:

```javascript
import { persist } from 'effector-storage/local'

const setX = createEvent()
const setY = createEvent()
const coords$ = createStore({ x: 123, y: 321 })
  .on(setX, ({ y }, x) => ({ x, y }))
  .on(setY, ({ x }, y) => ({ x, y }))

// persist X coordinate in `localStorage` with key 'x'
persist({
  source: coords$.map(({ x }) => x),
  target: setX,
  key: 'x',
})

// persist Y coordinate in `localStorage` with key 'y'
persist({
  source: coords$.map(({ y }) => y),
  target: setY,
  key: 'y',
})
```

⚠️ **BIG WARNING!**<br>
Use this approach with caution, beware of infinite circular updates. To avoid them, persist _only plain values_ in storage. So, mapped store in `source` will not trigger update, if object on original store has changed.

## TODO

- [x] [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) support
- [x] [sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage) support
- [ ] [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) support
- [ ] [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) support
- [ ] [Cookies](https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie) support
- [ ] you name it support

## Sponsored

[<img src="https://setplex.com/img/logo.png" alt="Setplex" width="236">](https://setplex.com)
