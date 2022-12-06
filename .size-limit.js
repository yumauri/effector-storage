module.exports = [
  // core
  {
    path: 'build/index.js',
    limit: '921 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/index.cjs',
    limit: '1152 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // nil adapter
  {
    path: 'build/nil/index.js',
    limit: '58 B',
    import: '{ nil }',
    ignore: ['effector'],
  },
  {
    path: 'build/nil/index.cjs',
    limit: '355 B',
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
    limit: '1205 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/local/index.cjs',
    limit: '1497 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // sessionStorage
  {
    path: 'build/session/index.js',
    limit: '1201 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/session/index.cjs',
    limit: '1496 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // query string
  {
    path: 'build/query/index.js',
    limit: '1310 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/query/index.cjs',
    limit: '1629 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // memory
  {
    path: 'build/memory/index.js',
    limit: '993 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/memory/index.cjs',
    limit: '1254 B',
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
    limit: '1264 B',
    import: '{ persist }',
    ignore: ['effector', '@react-native-async-storage/async-storage'],
  },
  {
    path: 'build/rn/async/index.cjs',
    limit: '1370 B',
    import: '{ persist }',
    ignore: ['effector', '@react-native-async-storage/async-storage'],
  },
  {
    path: 'build/rn/encrypted/index.js',
    limit: '1264 B',
    import: '{ persist }',
    ignore: ['effector', 'react-native-encrypted-storage'],
  },
  {
    path: 'build/rn/encrypted/index.cjs',
    limit: '1371 B',
    import: '{ persist }',
    ignore: ['effector', 'react-native-encrypted-storage'],
  },
]
