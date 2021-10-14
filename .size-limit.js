module.exports = [
  // core
  {
    path: 'build/index.js',
    limit: '728 B',
    ignore: ['effector'],
  },
  {
    path: 'build/index.cjs',
    limit: '704 B',
    ignore: ['effector'],
  },
  {
    path: 'build/fp/index.js',
    limit: '765 B',
    ignore: ['effector'],
  },
  {
    path: 'build/fp/index.cjs',
    limit: '766 B',
    ignore: ['effector'],
  },

  // nil adapter
  {
    path: 'build/nil/index.js',
    limit: '52 B',
    ignore: ['effector'],
  },
  {
    path: 'build/nil/index.cjs',
    limit: '40 B',
    ignore: ['effector'],
  },

  // storage adapter
  {
    path: 'build/storage/index.js',
    limit: '206 B',
    ignore: ['effector'],
  },
  {
    path: 'build/storage/index.cjs',
    limit: '192 B',
    ignore: ['effector'],
  },

  // localStorage
  {
    path: 'build/local/index.js',
    limit: '989 B',
    ignore: ['effector'],
  },
  {
    path: 'build/local/index.cjs',
    limit: '992 B',
    ignore: ['effector'],
  },
  {
    path: 'build/local/fp/index.js',
    limit: '1026 B',
    ignore: ['effector'],
  },
  {
    path: 'build/local/fp/index.cjs',
    limit: '1054 B',
    ignore: ['effector'],
  },

  // sessionStorage
  {
    path: 'build/session/index.js',
    limit: '985 B',
    ignore: ['effector'],
  },
  {
    path: 'build/session/index.cjs',
    limit: '986 B',
    ignore: ['effector'],
  },
  {
    path: 'build/session/fp/index.js',
    limit: '1022 B',
    ignore: ['effector'],
  },
  {
    path: 'build/session/fp/index.cjs',
    limit: '1052 B',
    ignore: ['effector'],
  },

  // query string
  {
    path: 'build/query/index.js',
    limit: '1111 B',
    ignore: ['effector'],
  },
  {
    path: 'build/query/index.cjs',
    limit: '1086 B',
    ignore: ['effector'],
  },
  {
    path: 'build/query/fp/index.js',
    limit: '1155 B',
    ignore: ['effector'],
  },
  {
    path: 'build/query/fp/index.cjs',
    limit: '1178 B',
    ignore: ['effector'],
  },

  // memory
  {
    path: 'build/memory/index.js',
    limit: '769 B',
    ignore: ['effector'],
  },
  {
    path: 'build/memory/index.cjs',
    limit: '739 B',
    ignore: ['effector'],
  },
  {
    path: 'build/memory/fp/index.js',
    limit: '799 B',
    ignore: ['effector'],
  },
  {
    path: 'build/memory/fp/index.cjs',
    limit: '799 B',
    ignore: ['effector'],
  },

  // async storage adapter
  {
    path: 'build/async-storage/index.js',
    limit: '136 B',
    ignore: ['effector'],
  },
  {
    path: 'build/async-storage/index.cjs',
    limit: '125 B',
    ignore: ['effector'],
  },

  // react native async storages
  {
    path: 'build/rn/async/index.js',
    limit: '863 B',
    ignore: ['effector', '@react-native-async-storage/async-storage'],
  },
  {
    path: 'build/rn/async/index.cjs',
    limit: '867 B',
    ignore: ['effector', '@react-native-async-storage/async-storage'],
  },
  {
    path: 'build/rn/encrypted/index.js',
    limit: '863 B',
    ignore: ['effector', 'react-native-encrypted-storage'],
  },
  {
    path: 'build/rn/encrypted/index.cjs',
    limit: '867 B',
    ignore: ['effector', 'react-native-encrypted-storage'],
  },
]
