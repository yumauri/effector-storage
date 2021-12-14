module.exports = [
  // core
  {
    path: 'build/index.js',
    limit: '845 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/index.cjs',
    limit: '903 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/fp/index.js',
    limit: '905 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/fp/index.cjs',
    limit: '976 B',
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
    limit: '1115 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/local/index.cjs',
    limit: '1240 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/local/fp/index.js',
    limit: '1176 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/local/fp/index.cjs',
    limit: '1314 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // sessionStorage
  {
    path: 'build/session/index.js',
    limit: '1111 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/session/index.cjs',
    limit: '1240 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/session/fp/index.js',
    limit: '1173 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/session/fp/index.cjs',
    limit: '1311 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // query string
  {
    path: 'build/query/index.js',
    limit: '1181 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/query/index.cjs',
    limit: '1333 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/query/fp/index.js',
    limit: '1240 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/query/fp/index.cjs',
    limit: '1440 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // memory
  {
    path: 'build/memory/index.js',
    limit: '894 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/memory/index.cjs',
    limit: '977 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/memory/fp/index.js',
    limit: '951 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/memory/fp/index.cjs',
    limit: '1048 B',
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
    limit: '1011 B',
    import: '{ persist }',
    ignore: ['effector', '@react-native-async-storage/async-storage'],
  },
  {
    path: 'build/rn/async/index.cjs',
    limit: '1142 B',
    import: '{ persist }',
    ignore: ['effector', '@react-native-async-storage/async-storage'],
  },
  {
    path: 'build/rn/encrypted/index.js',
    limit: '1009 B',
    import: '{ persist }',
    ignore: ['effector', 'react-native-encrypted-storage'],
  },
  {
    path: 'build/rn/encrypted/index.cjs',
    limit: '1141 B',
    import: '{ persist }',
    ignore: ['effector', 'react-native-encrypted-storage'],
  },
]
