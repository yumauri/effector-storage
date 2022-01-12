module.exports = [
  // core
  {
    path: 'build/index.js',
    limit: '892 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/index.cjs',
    limit: '1147 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/fp/index.js',
    limit: '951 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/fp/index.cjs',
    limit: '1220 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // nil adapter
  {
    path: 'build/nil/index.js',
    limit: '48 B',
    import: '{ nil }',
    ignore: ['effector'],
  },
  {
    path: 'build/nil/index.cjs',
    limit: '367 B',
    import: '{ nil }',
    ignore: ['effector'],
  },

  // storage adapter
  {
    path: 'build/storage/index.js',
    limit: '222 B',
    import: '{ storage }',
    ignore: ['effector'],
  },
  {
    path: 'build/storage/index.cjs',
    limit: '528 B',
    import: '{ storage }',
    ignore: ['effector'],
  },

  // localStorage
  {
    path: 'build/local/index.js',
    limit: '1165 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/local/index.cjs',
    limit: '1484 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/local/fp/index.js',
    limit: '1222 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/local/fp/index.cjs',
    limit: '1558 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // sessionStorage
  {
    path: 'build/session/index.js',
    limit: '1162 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/session/index.cjs',
    limit: '1484 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/session/fp/index.js',
    limit: '1219 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/session/fp/index.cjs',
    limit: '1555 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // query string
  {
    path: 'build/query/index.js',
    limit: '1233 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/query/index.cjs',
    limit: '1577 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/query/fp/index.js',
    limit: '1289 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/query/fp/index.cjs',
    limit: '1684 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // memory
  {
    path: 'build/memory/index.js',
    limit: '944 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/memory/index.cjs',
    limit: '1221 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/memory/fp/index.js',
    limit: '1001 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/memory/fp/index.cjs',
    limit: '1292 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // async storage adapter
  {
    path: 'build/async-storage/index.js',
    limit: '135 B',
    import: '{ asyncStorage }',
    ignore: ['effector'],
  },
  {
    path: 'build/async-storage/index.cjs',
    limit: '451 B',
    import: '{ asyncStorage }',
    ignore: ['effector'],
  },

  // react native async storages
  {
    path: 'build/rn/async/index.js',
    limit: '1254 B',
    import: '{ persist }',
    ignore: ['effector', '@react-native-async-storage/async-storage'],
  },
  {
    path: 'build/rn/async/index.cjs',
    limit: '1386 B',
    import: '{ persist }',
    ignore: ['effector', '@react-native-async-storage/async-storage'],
  },
  {
    path: 'build/rn/encrypted/index.js',
    limit: '1252 B',
    import: '{ persist }',
    ignore: ['effector', 'react-native-encrypted-storage'],
  },
  {
    path: 'build/rn/encrypted/index.cjs',
    limit: '1385 B',
    import: '{ persist }',
    ignore: ['effector', 'react-native-encrypted-storage'],
  },
]
