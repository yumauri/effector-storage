module.exports = [
  // root
  {
    name: 'root persist, es module',
    path: 'build/index.js',
    limit: '880 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    name: 'root persist, cjs module',
    path: 'build/index.cjs',
    limit: '2595 B',
    // import: '{ persist }', // tree-shaking is not working with cjs
    ignore: ['effector'],
  },

  // core
  {
    name: 'core persist, es module',
    path: 'build/core/index.js',
    limit: '876 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    name: 'core persist, cjs module',
    path: 'build/core/index.cjs',
    limit: '1065 B',
    // import: '{ persist }', // tree-shaking is not working with cjs
    ignore: ['effector'],
  },

  // tools
  {
    name: 'tools, es module',
    path: 'build/tools/index.js',
    limit: '121 B',
    import: '{ async, either }',
    ignore: ['effector'],
  },
  {
    name: 'tools, cjs module',
    path: 'build/tools/index.cjs',
    limit: '183 B',
    // import: '{ async, either }', // tree-shaking is not working with cjs
    ignore: ['effector'],
  },

  // nil adapter
  {
    name: 'nil adapter, es module',
    path: 'build/nil/index.js',
    limit: '68 B',
    import: '{ nil }',
    ignore: ['effector'],
  },
  {
    name: 'nil adapter, cjs module',
    path: 'build/nil/index.cjs',
    limit: '124 B',
    // import: '{ nil }', // tree-shaking is not working with cjs
    ignore: ['effector'],
  },

  // log adapter
  {
    name: 'log adapter, es module',
    path: 'build/log/index.js',
    limit: '120 B',
    import: '{ log }',
    ignore: ['effector'],
  },
  {
    name: 'log adapter, cjs module',
    path: 'build/log/index.cjs',
    limit: '180 B',
    // import: '{ log }', // tree-shaking is not working with cjs
    ignore: ['effector'],
  },

  // storage adapter
  {
    name: 'storage adapter, es module',
    path: 'build/storage/index.js',
    limit: '247 B',
    import: '{ storage }',
    ignore: ['effector'],
  },
  {
    name: 'storage adapter, cjs module',
    path: 'build/storage/index.cjs',
    limit: '302 B',
    // import: '{ storage }', // tree-shaking is not working with cjs
    ignore: ['effector'],
  },

  // localStorage
  {
    name: '`localStorage` persist, es module',
    path: 'build/local/index.js',
    limit: '1420 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    name: '`localStorage` persist, cjs module',
    path: 'build/local/index.cjs',
    limit: '1683 B',
    // import: '{ persist }', // tree-shaking is not working with cjs
    ignore: ['effector'],
  },

  // localStorage, but using adapter
  // should be ~ the same size as direct import
  {
    name: 'core adapter, es module',
    path: 'build/index.js',
    limit: '1426 B',
    import: '{ persist, local }',
    ignore: ['effector'],
  },
  {
    name: 'core adapter factory, es module',
    path: ['build/index.js', 'build/local/index.js'],
    limit: '1427 B',
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
    limit: '1416 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    name: '`sessionStorage` persist, cjs module',
    path: 'build/session/index.cjs',
    limit: '1679 B',
    // import: '{ persist }', // tree-shaking is not working with cjs
    ignore: ['effector'],
  },

  // query string
  {
    name: 'query string persist, es module',
    path: 'build/query/index.js',
    limit: '1441 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    name: 'query string persist, cjs module',
    path: 'build/query/index.cjs',
    limit: '1737 B',
    // import: '{ persist }', // tree-shaking is not working with cjs
    ignore: ['effector'],
  },

  // memory
  {
    name: 'memory adapter, es module',
    path: 'build/memory/index.js',
    limit: '1113 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    name: 'memory adapter, cjs module',
    path: 'build/memory/index.cjs',
    limit: '1340 B',
    // import: '{ persist }', // tree-shaking is not working with cjs
    ignore: ['effector'],
  },

  // async storage adapter
  {
    name: 'generic async storage adapter, es module',
    path: 'build/async-storage/index.js',
    limit: '157 B',
    import: '{ asyncStorage }',
    ignore: ['effector'],
  },
  {
    name: 'generic async storage adapter, cjs module',
    path: 'build/async-storage/index.cjs',
    limit: '216 B',
    // import: '{ asyncStorage }', // tree-shaking is not working with cjs
    ignore: ['effector'],
  },

  // react native async storages
  {
    name: '`AsyncStorage` persist, es module',
    path: 'build/rn/async/index.js',
    limit: '1402 B',
    import: '{ persist }',
    ignore: ['effector', '@react-native-async-storage/async-storage'],
  },
  {
    name: '`AsyncStorage` persist, cjs module',
    path: 'build/rn/async/index.cjs',
    limit: '1468 B',
    // import: '{ persist }', // tree-shaking is not working with cjs
    ignore: ['effector', '@react-native-async-storage/async-storage'],
  },
  {
    name: '`EncryptedStorage` persist, es module',
    path: 'build/rn/encrypted/index.js',
    limit: '1400 B',
    import: '{ persist }',
    ignore: ['effector', 'react-native-encrypted-storage'],
  },
  {
    name: '`EncryptedStorage` persist, cjs module',
    path: 'build/rn/encrypted/index.cjs',
    limit: '1468 B',
    // import: '{ persist }', // tree-shaking is not working with cjs
    ignore: ['effector', 'react-native-encrypted-storage'],
  },
]
