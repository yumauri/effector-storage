module.exports = [
  // core
  {
    name: 'core persist, es module',
    path: 'build/index.js',
    limit: '743 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    name: 'core persist, cjs module',
    path: 'build/index.cjs',
    limit: '2246 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // nil adapter
  {
    name: 'nil adapter, es module',
    path: 'build/nil/index.js',
    limit: '58 B',
    import: '{ nil }',
    ignore: ['effector'],
  },
  {
    name: 'nil adapter, cjs module',
    path: 'build/nil/index.cjs',
    limit: '355 B',
    import: '{ nil }',
    ignore: ['effector'],
  },

  // storage adapter
  {
    name: 'storage adapter, es module',
    path: 'build/storage/index.js',
    limit: '233 B',
    import: '{ storage }',
    ignore: ['effector'],
  },
  {
    name: 'storage adapter, cjs module',
    path: 'build/storage/index.cjs',
    limit: '516 B',
    import: '{ storage }',
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
    limit: '1536 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // localStorage, but using adapter
  // should be ~ the same size as direct import
  {
    name: 'core persist + `localStorage` adapter, es module',
    path: 'build/index.js',
    limit: '1259 B',
    import: '{ persist, local }',
    ignore: ['effector'],
  },
  {
    name: 'core persist + `localStorage` adapter factory, es module',
    path: ['build/index.js', 'build/local/index.js'],
    limit: '1261 B',
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
    limit: '1533 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // query string
  {
    name: 'query string persist, es module',
    path: 'build/query/index.js',
    limit: '1297 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    name: 'query string persist, cjs module',
    path: 'build/query/index.cjs',
    limit: '1604 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // memory
  {
    name: 'memory adapter, es module',
    path: 'build/memory/index.js',
    limit: '975 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    name: 'memory adapter, cjs module',
    path: 'build/memory/index.cjs',
    limit: '1226 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // async storage adapter
  {
    name: 'generic async storage adapter, es module',
    path: 'build/async-storage/index.js',
    limit: '143 B',
    import: '{ asyncStorage }',
    ignore: ['effector'],
  },
  {
    name: 'generic async storage adapter, cjs module',
    path: 'build/async-storage/index.cjs',
    limit: '438 B',
    import: '{ asyncStorage }',
    ignore: ['effector'],
  },

  // react native async storages
  {
    name: '`AsyncStorage` persist, es module',
    path: 'build/rn/async/index.js',
    limit: '1246 B',
    import: '{ persist }',
    ignore: ['effector', '@react-native-async-storage/async-storage'],
  },
  {
    name: '`AsyncStorage` persist, cjs module',
    path: 'build/rn/async/index.cjs',
    limit: '1346 B',
    import: '{ persist }',
    ignore: ['effector', '@react-native-async-storage/async-storage'],
  },
  {
    name: '`EncryptedStorage` persist, es module',
    path: 'build/rn/encrypted/index.js',
    limit: '1245 B',
    import: '{ persist }',
    ignore: ['effector', 'react-native-encrypted-storage'],
  },
  {
    name: '`EncryptedStorage` persist, cjs module',
    path: 'build/rn/encrypted/index.cjs',
    limit: '1346 B',
    import: '{ persist }',
    ignore: ['effector', 'react-native-encrypted-storage'],
  },
]
