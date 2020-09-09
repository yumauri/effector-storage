# effector-storage

[![Build Status](https://github.com/yumauri/effector-storage/workflows/build/badge.svg)](https://github.com/yumauri/effector-storage/actions?workflow=build)
[![License](https://img.shields.io/github/license/yumauri/effector-storage.svg?color=yellow)](./LICENSE)
[![NPM](https://img.shields.io/npm/v/effector-storage.svg)](https://www.npmjs.com/package/effector-storage)
![Made with Love](https://img.shields.io/badge/made%20with-❤-red.svg)

Small module for [Effector](https://github.com/zerobias/effector) ☄️ to sync stores with different storages (local storage, session storage, async storage, IndexedDB, cookies, server side storage, etc).

## Install

```bash
$ yarn add effector-storage@next
```

Or using `npm`

```bash
$ npm install --save effector-storage@next
```

## Simple usage

```javascript
import { createEvent, createStore } from 'effector'
import { withStorage } from 'effector-storage/local'

const increment = createEvent('increment')
const decrement = createEvent('decrement')
const resetCounter = createEvent('reset counter')

// ↓ create wrapper
const createStorageStore = withStorage(createStore)

const counter = createStorageStore(0, { key: 'counter' }) // ← use wrapper
  .catch((err) => console.log(err)) // ← setup error handling
  .on(increment, (state) => state + 1)
  .on(decrement, (state) => state - 1)
  .reset(resetCounter)
```

## Advanced usage

`effector-storage` consists of a _core_ module and _adapter_ modules.

The core module itself does nothing with actual storage, it just _ties_ a `createStore` function (or an existing store instance) to the storage adapter.

The storage adapter gets and sets store values, and also can asynchronously update store value on storage updates.

Since core module _ties_ `createStore` (or store instance) with storage adapter — it exports single function `tie`:

```javascript
import { tie } from 'effector-storage'
```

Function `tie` accepts two (optionally three) arguments:

- `createStore` function or store instance
- config with mandatory storage adapter in field `with`
- and optionally `createEvent` function or event instance, which will be used to update store asynchronously

You can pass two first arguments in any order. Also function `tie` is curried, so you can partially apply it to use later.

```javascript
import { createEvent, createStore } from 'effector'
import { tie } from 'effector-storage'
import { localStorage } from 'effector-storage/local'

// tie store creator with local storage adapter
const createStorageStore = tie(createStore, { with: localStorage })

// or you can switch parameters, this will do the same as above
const createStorageStore = tie({ with: localStorage }, createStore)

// you can partially apply `tie`,
// to use it with different `createStore` functions
// `withStorage` exported from 'effector-storage/local' does this exactly
const withStorage = tie({ with: localStorage })
const createStorageStore = withStorage(createStore)

// or you can partly apply other way around,
// to tie `createStore` to different storage adapters later
const withAdapter = tie(createStore)
const createStorageStore = withAdapter({ with: localStorage })
```

### Asynchronous updates

If storage adapter supports asynchronous updates from third side — you can pass `createEvent` function or event instance to `tie` function. Tied store will be subscribed to this new (or existing) event.

You can use field `using` for that, or third optional argument:

```javascript
import { createEvent, createStore } from 'effector'
import { tie } from 'effector-storage'
import { localStorage } from 'effector-storage/local'

// with `using` field
const createStorageStore = tie(createStore, { with: localStorage, using: createEvent })

// using third argument
const createStorageStore = tie(createStore, { with: localStorage }, createEvent)

// with partially application
const withStorage = tie({ with: localStorage })
const createStorageStore = withStorage(createStore, createEvent)
```

Note, that if you are using third argument, you can't curry it — it is impossible to curry optional argument.

### Using with existing stores

You can tie existing storage. There are few requirements, though:

- it is mandatory to use `key` in config (alongside other adapter options, if any)
- it is mandatory to use `createEvent` function (or existing event) to update store value from storage (otherwise tie will be useless)

```javascript
import { createEvent, createStore } from 'effector'
import { tie } from 'effector-storage'
import { localStorage } from 'effector-storage/local'

const counter = createStore(0)
tie(counter, { with: localStorage, using: createEvent, key: 'counter' })

// `tie` modifies and return same instance:
const tied = tie(counter, { with: localStorage, using: createEvent, key: 'counter' })
assert(counter === tied) // <- true
// but you can use this to get types:
// -> counter: Store<number>
// -> tied: StorageStore<number>
```

You can use existing event, to get notified about store updates:

```javascript
import { createEvent, createStore } from 'effector'
import { tie } from 'effector-storage'
import { localStorage } from 'effector-storage/local'

const updated = createEvent<number>()
updated.watch((value) => {
  console.log('store was updated with value', value)
})

const counter = createStore(0)
tie(counter, { with: localStorage, using: updated, key: 'counter' })

// if `localStorage.getItem('counter')` !== '0', you will see message
// > store was updated with value ...
```

## Migration from versions prior to 4.0.0

If you use localStorage:

```diff
- import withStorage from 'effector-storage'
+ import { withStorage } from 'effector-storage/local'
```

If you use sessionStorage:

```diff
- import withStorage from 'effector-storage'
+ import { withStorage } from 'effector-storage/session'

- const createStorageStore = withStorage(createStore, sessionStorage)
+ const createStorageStore = withStorage(createStore)
```

If you use sync version (new `localStorage` adapter is sync by default):

```diff
- import withStorage from 'effector-storage/sync'
+ import { withStorage } from 'effector-storage/local'
```

## Storage adapter

// TODO: add description

## Sponsored

[<img src="https://setplex.com/img/logo.png" alt="Setplex" width="236">](https://setplex.com)
