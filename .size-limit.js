module.exports = [
  // core
  {
    path: 'build/index.js',
    limit: '925 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/index.cjs',
    limit: '1154 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // nil adapter
  {
    path: 'build/nil/index.js',
    limit: '56 B',
    import: '{ nil }',
    ignore: ['effector'],
  },
  {
    path: 'build/nil/index.cjs',
    limit: '352 B',
    import: '{ nil }',
    ignore: ['effector'],
  },

  // storage adapter
  {
    path: 'build/storage/index.js',
    limit: '230 B',
    import: '{ storage }',
    ignore: ['effector'],
  },
  {
    path: 'build/storage/index.cjs',
    limit: '512 B',
    import: '{ storage }',
    ignore: ['effector'],
  },

  // localStorage
  {
    path: 'build/local/index.js',
    limit: '1192 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/local/index.cjs',
    limit: '1483 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // sessionStorage
  {
    path: 'build/session/index.js',
    limit: '1191 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/session/index.cjs',
    limit: '1478 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // query string
  {
    path: 'build/query/index.js',
    limit: '1268 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/query/index.cjs',
    limit: '1586 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // memory
  {
    path: 'build/memory/index.js',
    limit: '978 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/memory/index.cjs',
    limit: '1229 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // async storage adapter
  {
    path: 'build/async-storage/index.js',
    limit: '143 B',
    import: '{ asyncStorage }',
    ignore: ['effector'],
  },
  {
    path: 'build/async-storage/index.cjs',
    limit: '438 B',
    import: '{ asyncStorage }',
    ignore: ['effector'],
  },

  // react native async storages
  {
    path: 'build/rn/async/index.js',
    limit: '1255 B',
    import: '{ persist }',
    ignore: ['effector', '@react-native-async-storage/async-storage'],
  },
  {
    path: 'build/rn/async/index.cjs',
    limit: '1389 B',
    import: '{ persist }',
    ignore: ['effector', '@react-native-async-storage/async-storage'],
  },
  {
    path: 'build/rn/encrypted/index.js',
    limit: '1254 B',
    import: '{ persist }',
    ignore: ['effector', 'react-native-encrypted-storage'],
  },
  {
    path: 'build/rn/encrypted/index.cjs',
    limit: '1389 B',
    import: '{ persist }',
    ignore: ['effector', 'react-native-encrypted-storage'],
  },
]
