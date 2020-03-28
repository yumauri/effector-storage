# effector-storage

[![Build Status](https://github.com/yumauri/effector-storage/workflows/build/badge.svg)](https://github.com/yumauri/effector-storage/actions?workflow=build)
[![License](https://img.shields.io/github/license/yumauri/effector-storage.svg?color=yellow)](./LICENSE)
[![NPM](https://img.shields.io/npm/v/effector-storage.svg)](https://www.npmjs.com/package/effector-storage)
![Made with Love](https://img.shields.io/badge/made%20with-❤-red.svg)

Small module for [Effector](https://github.com/zerobias/effector) ☄️ to sync stores with `localStorage` (or `sessionStorage`).<br>
Heavily inspired by [effector-localstorage](https://github.com/lessmess-dev/effector-localstorage).

## Install

```bash
$ yarn add effector-storage
```

Or using `npm`

```bash
$ npm install --save effector-storage
```

## Usage

```javascript
import { createEvent, createStore } from 'effector'
import withStorage from 'effector-storage'

const increment = createEvent('increment')
const decrement = createEvent('decrement')
const resetCounter = createEvent('reset counter')

// ↓ create wrapper, uses localStorage by default
const createStorageStore = withStorage(createStore)

// ↓ or create wrapper, which uses sessionStorage
// const createStorageStore = withStorage(createStore, sessionStorage)

const counter = createStorageStore(0, { key: 'counter' }) // ← use wrapper
  .catch(err => console.log(err)) // ← setup error handling
  .on(increment, state => state + 1)
  .on(decrement, state => state - 1)
  .reset(resetCounter)
```

## Options

While creating store, function, enchanced with `withStorage`, accepts same arguments, as usual `createStore`, with one difference - it is mandatory to set `key` in options. This key will be used for storage key.

## Synchronize store between different tabs/windows

Local storage has one awesome feature — it can be synced between two (or more) widows/tabs. Window has [storage](https://www.w3schools.com/jsref/event_storage_url.asp) event, which is only triggered when a window **other than itself** makes the changes.

This way it is possible to synchronise counter on two tabs of a browser. Or, closer to reality, abstract flag `authenticated`, when user performs logout on one tab — that triggers logout on all other opened tabs with the same application.

To make store synchronizable, just use `effector-storage/sync` instead of `effector-storage`.

```javascript
import { createEvent, createStore } from 'effector'
import withStorage from 'effector-storage/sync'

const increment = createEvent('increment')
const decrement = createEvent('decrement')
const resetCounter = createEvent('reset counter')

// ↓ create wrapper, uses localStorage by default
const createStorageStore = withStorage(createStore)

// you can use it with sessionStorage, but this makes no sense,
// because different tabs/windows doesn't share same session storage

const counter = createStorageStore(0, { key: 'counter' }) // ← use wrapper
  .catch(err => console.log(err)) // ← setup error handling
  .on(increment, state => state + 1)
  .on(decrement, state => state - 1)
  .reset(resetCounter)
```

## ES modules

`effector-storage` provides ES modules out of the box. You do not need to do anything to use it as ES module in Webpack, Parcel, or Node.js.

## Experimental

This library provides an experimental Starage unit — this is Effector node, like event, which can set value to localStorage or dispatch value from localStorage.

```javascript
import { createStore, forward } from 'effector'
const { createStorage } = require('effector-storage/unit')

const storage = createStorage()
const $counter = createStore(0)

// this forward will save store value to localStorage, with key 'counter'
forward({
  from: $counter,
  to: storage.set('counter'),
})

// this forward will update store value from localStorage (sync between tabs)
forward({
  from: storage.get('counter'),
  to: $counter,
})

// or you can subscribe store as usual
// $counter.on(storage.get('counter'), (_, value) => value)

// calling unit `storage` will trigger `storage.get('counter')` event
storage({ key: 'counter' })

// in case of any exception event `storage.fail` will be triggered
storage.fail.watch(_ => console.log(_))
const recursive = {}
recursive.recursive = recursive
$store.setState(recursive)
/* {
  key: 'counter',
  value: <ref *1> { recursive: [Circular *1] },
  error: TypeError: Converting circular structure to JSON ...
} */
```

`storage.set(key)` function actually creates `storage.prepend(value => ({ key, value }))` event.
`storage.get(key)` function actually creates `storage.filter({ fn: data => data.key === key }).map(({ value }) => value)` event.

Functions `storage.set` and `storage.get` are using caches for created events. You can call this functions many times — extra events will not be created.

<img width="630" alt="unit" src="https://github.com/yumauri/effector-storage/blob/master/images/node.png?raw=true">

## Sponsored

[<img src="https://setplex.com/img/logo.png" alt="Setplex" width="236">](https://setplex.com)
