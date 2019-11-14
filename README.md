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

To make store synchronizable, just use `effector-storage/sync` instead of `effector-storage`. Also it will need specifying of `createEvent` function (to create event internally).

```javascript
import { createEvent, createStore } from 'effector'
import withStorage from 'effector-storage/sync'

const increment = createEvent('increment')
const decrement = createEvent('decrement')
const resetCounter = createEvent('reset counter')

// ↓ create wrapper, uses localStorage by default
const createStorageStore = withStorage(createStore, createEvent)

// you can use it with sessionStorage, but this makes no sense,
// because different tabs/windows doesn't share same session storage

const counter = createStorageStore(0, { key: 'counter' }) // ← use wrapper
  .catch(err => console.log(err)) // ← setup error handling
  .on(increment, state => state + 1)
  .on(decrement, state => state - 1)
  .reset(resetCounter)
```

## Sponsored

[<img src="https://setplex.com/img/logo.png" alt="Setplex" width="236">](https://setplex.com)
