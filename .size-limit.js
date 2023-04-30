module.exports = [
  // root
  {
    name: 'root persist, es module',
    path: 'build/index.js',
    limit: '924 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    name: 'root persist, cjs module',
    path: 'build/index.cjs',
    limit: '2765 B',
    // import: '{ persist }', // tree-shaking is not working with cjs
    ignore: ['effector'],
  },

  // core
  {
    name: 'core persist, es module',
    path: 'build/core/index.js',
    limit: '919 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    name: 'core persist, cjs module',
    path: 'build/core/index.cjs',
    limit: '1105 B',
    // import: '{ persist }', // tree-shaking is not working with cjs
    ignore: ['effector'],
  },

  // tools
  {
    name: 'tools, es module',
    path: 'build/tools/index.js',
    limit: '315 B',
    import: '{ async, either, farcached }',
    ignore: ['effector'],
  },
  {
    name: 'tools, cjs module',
    path: 'build/tools/index.cjs',
    limit: '509 B',
    // import: '{ async, either, farcached }', // tree-shaking is not working with cjs
    ignore: ['effector'],
  },

  // nil adapter
  {
    name: 'nil adapter, es module',
    path: 'build/nil/index.js',
    limit: '82 B',
    import: '{ nil }',
    ignore: ['effector'],
  },
  {
    name: 'nil adapter, cjs module',
    path: 'build/nil/index.cjs',
    limit: '140 B',
    // import: '{ nil }', // tree-shaking is not working with cjs
    ignore: ['effector'],
  },

  // log adapter
  {
    name: 'log adapter, es module',
    path: 'build/log/index.js',
    limit: '139 B',
    import: '{ log }',
    ignore: ['effector'],
  },
  {
    name: 'log adapter, cjs module',
    path: 'build/log/index.cjs',
    limit: '202 B',
    // import: '{ log }', // tree-shaking is not working with cjs
    ignore: ['effector'],
  },

  // storage adapter
  {
    name: 'storage adapter, es module',
    path: 'build/storage/index.js',
    limit: '266 B',
    import: '{ storage }',
    ignore: ['effector'],
  },
  {
    name: 'storage adapter, cjs module',
    path: 'build/storage/index.cjs',
    limit: '324 B',
    // import: '{ storage }', // tree-shaking is not working with cjs
    ignore: ['effector'],
  },

  // localStorage
  {
    name: '`localStorage` persist, es module',
    path: 'build/local/index.js',
    limit: '1254 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    name: '`localStorage` persist, cjs module',
    path: 'build/local/index.cjs',
    limit: '1529 B',
    // import: '{ persist }', // tree-shaking is not working with cjs
    ignore: ['effector'],
  },

  // localStorage, but using adapter
  // should be ~ the same size as direct import
  {
    name: 'core adapter, es module',
    path: 'build/index.js',
    limit: '1261 B',
    import: '{ persist, local }',
    ignore: ['effector'],
  },
  {
    name: 'core adapter factory, es module',
    path: ['build/index.js', 'build/local/index.js'],
    limit: '1264 B',
    import: {
      'build/index.js': '{ persist }',
      'build/local/index.js': '{ local }',
    },
    ignore: ['effector'],
  },

  // sessionStorage
  {
    name: '`sessionStorage` persist, es module',
    path: 'build/session/index.js',
    limit: '1252 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    name: '`sessionStorage` persist, cjs module',
    path: 'build/session/index.cjs',
    limit: '1526 B',
    // import: '{ persist }', // tree-shaking is not working with cjs
    ignore: ['effector'],
  },

  // query string
  {
    name: 'query string persist, es module',
    path: 'build/query/index.js',
    limit: '1395 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    name: 'query string persist, cjs module',
    path: 'build/query/index.cjs',
    limit: '1693 B',
    // import: '{ persist }', // tree-shaking is not working with cjs
    ignore: ['effector'],
  },

  // memory
  {
    name: 'memory adapter, es module',
    path: 'build/memory/index.js',
    limit: '1014 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    name: 'memory adapter, cjs module',
    path: 'build/memory/index.cjs',
    limit: '1241 B',
    // import: '{ persist }', // tree-shaking is not working with cjs
    ignore: ['effector'],
  },

  // async storage adapter
  {
    name: 'generic async storage adapter, es module',
    path: 'build/async-storage/index.js',
    limit: '167 B',
    import: '{ asyncStorage }',
    ignore: ['effector'],
  },
  {
    name: 'generic async storage adapter, cjs module',
    path: 'build/async-storage/index.cjs',
    limit: '229 B',
    // import: '{ asyncStorage }', // tree-shaking is not working with cjs
    ignore: ['effector'],
  },

  // react native async storages
  {
    name: '`AsyncStorage` persist, es module',
    path: 'build/rn/async/index.js',
    limit: '1339 B',
    import: '{ persist }',
    ignore: ['effector', '@react-native-async-storage/async-storage'],
  },
  {
    name: '`AsyncStorage` persist, cjs module',
    path: 'build/rn/async/index.cjs',
    limit: '1367 B',
    // import: '{ persist }', // tree-shaking is not working with cjs
    ignore: ['effector', '@react-native-async-storage/async-storage'],
  },
  {
    name: '`EncryptedStorage` persist, es module',
    path: 'build/rn/encrypted/index.js',
    limit: '1338 B',
    import: '{ persist }',
    ignore: ['effector', 'react-native-encrypted-storage'],
  },
  {
    name: '`EncryptedStorage` persist, cjs module',
    path: 'build/rn/encrypted/index.cjs',
    limit: '1368 B',
    // import: '{ persist }', // tree-shaking is not working with cjs
    ignore: ['effector', 'react-native-encrypted-storage'],
  },
]
