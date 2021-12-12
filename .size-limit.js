module.exports = [
  // core
  {
    path: 'build/index.js',
    limit: '839 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/index.cjs',
    limit: '898 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/fp/index.js',
    limit: '900 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/fp/index.cjs',
    limit: '973 B',
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
    limit: '366 B',
    import: '{ nil }',
    ignore: ['effector'],
  },

  // storage adapter
  {
    path: 'build/storage/index.js',
    limit: '223 B',
    import: '{ storage }',
    ignore: ['effector'],
  },
  {
    path: 'build/storage/index.cjs',
    limit: '525 B',
    import: '{ storage }',
    ignore: ['effector'],
  },

  // localStorage
  {
    path: 'build/local/index.js',
    limit: '1112 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/local/index.cjs',
    limit: '1236 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/local/fp/index.js',
    limit: '1170 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/local/fp/index.cjs',
    limit: '1305 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // sessionStorage
  {
    path: 'build/session/index.js',
    limit: '1106 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/session/index.cjs',
    limit: '1232 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/session/fp/index.js',
    limit: '1166 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/session/fp/index.cjs',
    limit: '1304 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // query string
  {
    path: 'build/query/index.js',
    limit: '1174 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/query/index.cjs',
    limit: '1327 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/query/fp/index.js',
    limit: '1233 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/query/fp/index.cjs',
    limit: '1433 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // memory
  {
    path: 'build/memory/index.js',
    limit: '889 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/memory/index.cjs',
    limit: '973 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/memory/fp/index.js',
    limit: '947 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/memory/fp/index.cjs',
    limit: '1045 B',
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
    limit: '1003 B',
    import: '{ persist }',
    ignore: ['effector', '@react-native-async-storage/async-storage'],
  },
  {
    path: 'build/rn/async/index.cjs',
    limit: '1133 B',
    import: '{ persist }',
    ignore: ['effector', '@react-native-async-storage/async-storage'],
  },
  {
    path: 'build/rn/encrypted/index.js',
    limit: '1004 B',
    import: '{ persist }',
    ignore: ['effector', 'react-native-encrypted-storage'],
  },
  {
    path: 'build/rn/encrypted/index.cjs',
    limit: '1132 B',
    import: '{ persist }',
    ignore: ['effector', 'react-native-encrypted-storage'],
  },
]
