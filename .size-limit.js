module.exports = [
  // root
  {
    name: 'root persist, es module',
    path: 'build/index.js',
    limit: '1101 B',
    import: '{ persist }',
    ignore: ['effector'],
    gzip: true,
  },
  {
    name: 'root persist, cjs module',
    path: 'build/index.cjs',
    limit: '3368 B',
    // import: '{ persist }', // tree-shaking is not working with cjs
    ignore: ['effector'],
    gzip: true,
  },

  // core
  {
    name: 'core persist, es module',
    path: 'build/core/index.js',
    limit: '1095 B',
    import: '{ persist }',
    ignore: ['effector'],
    gzip: true,
  },
  {
    name: 'core persist, cjs module',
    path: 'build/core/index.cjs',
    limit: '1281 B',
    // import: '{ persist }', // tree-shaking is not working with cjs
    ignore: ['effector'],
    gzip: true,
  },

  // tools
  {
    name: 'tools, es module',
    path: 'build/tools/index.js',
    limit: '289 B',
    import: '{ async, either, farcached }',
    ignore: ['effector'],
    gzip: true,
  },
  {
    name: 'tools, cjs module',
    path: 'build/tools/index.cjs',
    limit: '482 B',
    // import: '{ async, either, farcached }', // tree-shaking is not working with cjs
    ignore: ['effector'],
    gzip: true,
  },

  // nil adapter
  {
    name: 'nil adapter, es module',
    path: 'build/nil/index.js',
    limit: '83 B',
    import: '{ nil }',
    ignore: ['effector'],
    gzip: true,
  },
  {
    name: 'nil adapter, cjs module',
    path: 'build/nil/index.cjs',
    limit: '139 B',
    // import: '{ nil }', // tree-shaking is not working with cjs
    ignore: ['effector'],
    gzip: true,
  },

  // log adapter
  {
    name: 'log adapter, es module',
    path: 'build/log/index.js',
    limit: '139 B',
    import: '{ log }',
    ignore: ['effector'],
    gzip: true,
  },
  {
    name: 'log adapter, cjs module',
    path: 'build/log/index.cjs',
    limit: '203 B',
    // import: '{ log }', // tree-shaking is not working with cjs
    ignore: ['effector'],
    gzip: true,
  },

  // storage adapter
  {
    name: 'storage adapter, es module',
    path: 'build/storage/index.js',
    limit: '399 B',
    import: '{ storage }',
    ignore: ['effector'],
    gzip: true,
  },
  {
    name: 'storage adapter, cjs module',
    path: 'build/storage/index.cjs',
    limit: '460 B',
    // import: '{ storage }', // tree-shaking is not working with cjs
    ignore: ['effector'],
    gzip: true,
  },

  // localStorage
  {
    name: '`localStorage` persist, es module',
    path: 'build/local/index.js',
    limit: '1572 B',
    import: '{ persist }',
    ignore: ['effector'],
    gzip: true,
  },
  {
    name: '`localStorage` persist, cjs module',
    path: 'build/local/index.cjs',
    limit: '1854 B',
    // import: '{ persist }', // tree-shaking is not working with cjs
    ignore: ['effector'],
    gzip: true,
  },

  // localStorage, but using adapter
  // should be ~ the same size as direct import
  {
    name: 'core adapter, es module',
    path: 'build/index.js',
    limit: '1553 B',
    import: '{ persist, local }',
    ignore: ['effector'],
    gzip: true,
  },
  {
    name: 'core adapter factory, es module',
    path: ['build/index.js', 'build/local/index.js'],
    limit: '1555 B',
    import: {
      'build/index.js': '{ persist }',
      'build/local/index.js': '{ local }',
    },
    ignore: ['effector'],
    gzip: true,
  },

  // sessionStorage
  {
    name: '`sessionStorage` persist, es module',
    path: 'build/session/index.js',
    limit: '1569 B',
    import: '{ persist }',
    ignore: ['effector'],
    gzip: true,
  },
  {
    name: '`sessionStorage` persist, cjs module',
    path: 'build/session/index.cjs',
    limit: '1849 B',
    // import: '{ persist }', // tree-shaking is not working with cjs
    ignore: ['effector'],
    gzip: true,
  },

  // query string
  {
    name: 'query string persist, es module',
    path: 'build/query/index.js',
    limit: '1626 B',
    import: '{ persist }',
    ignore: ['effector'],
    gzip: true,
  },
  {
    name: 'query string persist, cjs module',
    path: 'build/query/index.cjs',
    limit: '1921 B',
    // import: '{ persist }', // tree-shaking is not working with cjs
    ignore: ['effector'],
    gzip: true,
  },

  // memory
  {
    name: 'memory adapter, es module',
    path: 'build/memory/index.js',
    limit: '1191 B',
    import: '{ persist }',
    ignore: ['effector'],
    gzip: true,
  },
  {
    name: 'memory adapter, cjs module',
    path: 'build/memory/index.cjs',
    limit: '1423 B',
    // import: '{ persist }', // tree-shaking is not working with cjs
    ignore: ['effector'],
    gzip: true,
  },

  // async storage adapter
  {
    name: 'generic async storage adapter, es module',
    path: 'build/async-storage/index.js',
    limit: '162 B',
    import: '{ asyncStorage }',
    ignore: ['effector'],
    gzip: true,
  },
  {
    name: 'generic async storage adapter, cjs module',
    path: 'build/async-storage/index.cjs',
    limit: '228 B',
    // import: '{ asyncStorage }', // tree-shaking is not working with cjs
    ignore: ['effector'],
    gzip: true,
  },

  // broadcast channel adapter
  {
    name: 'broadcast channel adapter, es module',
    path: 'build/broadcast/index.js',
    limit: '370 B',
    import: '{ broadcast }',
    ignore: ['effector'],
    gzip: true,
  },
  {
    name: 'broadcast channel adapter, cjs module',
    path: 'build/broadcast/index.cjs',
    limit: '1691 B',
    // import: '{ broadcast }', // tree-shaking is not working with cjs
    ignore: ['effector'],
    gzip: true,
  },
]
