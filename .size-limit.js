module.exports = [
  // core
  {
    path: 'build/index.js',
    limit: '724 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/index.cjs',
    limit: '815 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/fp/index.js',
    limit: '780 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/fp/index.cjs',
    limit: '876 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // nil adapter
  {
    path: 'build/nil/index.js',
    limit: '50 B',
    import: '{ nil }',
    ignore: ['effector'],
  },
  {
    path: 'build/nil/index.cjs',
    limit: '134 B',
    import: '{ nil }',
    ignore: ['effector'],
  },

  // storage adapter
  {
    path: 'build/storage/index.js',
    limit: '226 B',
    import: '{ storage }',
    ignore: ['effector'],
  },
  {
    path: 'build/storage/index.cjs',
    limit: '298 B',
    import: '{ storage }',
    ignore: ['effector'],
  },

  // localStorage
  {
    path: 'build/local/index.js',
    limit: '991 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/local/index.cjs',
    limit: '1136 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/local/fp/index.js',
    limit: '1042 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/local/fp/index.cjs',
    limit: '1205 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // sessionStorage
  {
    path: 'build/session/index.js',
    limit: '988 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/session/index.cjs',
    limit: '1136 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/session/fp/index.js',
    limit: '1039 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/session/fp/index.cjs',
    limit: '1205 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // query string
  {
    path: 'build/query/index.js',
    limit: '1058 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/query/index.cjs',
    limit: '1197 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/query/fp/index.js',
    limit: '1116 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/query/fp/index.cjs',
    limit: '1334 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // memory
  {
    path: 'build/memory/index.js',
    limit: '757 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/memory/index.cjs',
    limit: '880 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/memory/fp/index.js',
    limit: '815 B',
    import: '{ persist }',
    ignore: ['effector'],
  },
  {
    path: 'build/memory/fp/index.cjs',
    limit: '948 B',
    import: '{ persist }',
    ignore: ['effector'],
  },

  // async storage adapter
  {
    path: 'build/async-storage/index.js',
    limit: '136 B',
    import: '{ asyncStorage }',
    ignore: ['effector'],
  },
  {
    path: 'build/async-storage/index.cjs',
    limit: '220 B',
    import: '{ asyncStorage }',
    ignore: ['effector'],
  },

  // react native async storages
  {
    path: 'build/rn/async/index.js',
    limit: '849 B',
    import: '{ persist }',
    ignore: ['effector', '@react-native-async-storage/async-storage'],
  },
  {
    path: 'build/rn/async/index.cjs',
    limit: '1032 B',
    import: '{ persist }',
    ignore: ['effector', '@react-native-async-storage/async-storage'],
  },
  {
    path: 'build/rn/encrypted/index.js',
    limit: '849 B',
    import: '{ persist }',
    ignore: ['effector', 'react-native-encrypted-storage'],
  },
  {
    path: 'build/rn/encrypted/index.cjs',
    limit: '1030 B',
    import: '{ persist }',
    ignore: ['effector', 'react-native-encrypted-storage'],
  },
]
