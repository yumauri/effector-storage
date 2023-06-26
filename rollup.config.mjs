import { terser } from 'rollup-plugin-terser'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import command from 'rollup-plugin-command'
import generateDts from 'rollup-plugin-dts'
import generatePackageJson from 'rollup-plugin-generate-package-json'

const SRC = 'src'
const BUILD = 'build'

const external = [
  'effector',
  'react-native-encrypted-storage',
  '@react-native-async-storage/async-storage',
  /\.[./]*\/core/,
  /\.[./]*\/tools/,
  /\.[./]*\/nil/,
  /\.[./]*\/log/,
  /\.[./]*\/storage/,
  /\.[./]*\/local/,
  /\.[./]*\/session/,
  /\.[./]*\/query/,
  /\.[./]*\/memory/,
  /\.[./]*\/async-storage/,
  /\.[./]*\/broadcast/,
  /\.[./]*\/rn\/async/,
  /\.[./]*\/rn\/encrypted/,
]

const src = (name) => ({
  input: `${SRC}/${name}index.ts`,
  output: [
    {
      file: `${BUILD}/${name}index.cjs`,
      format: 'cjs',
      sourcemap: process.env.NODE_ENV === 'production',
      externalLiveBindings: false,
      esModule: false,
      exports: 'named',
    },
    {
      file: `${BUILD}/${name}index.js`,
      format: 'es',
      sourcemap: process.env.NODE_ENV === 'production',
      exports: 'named',
    },
  ],
  external,
  plugins: [
    // resolve typescript files
    nodeResolve({
      extensions: ['.ts'],
    }),

    // apply babel transformations
    babel({
      extensions: ['.ts'],
      babelHelpers: 'bundled',
      presets: ['@babel/preset-typescript'],
      plugins: ['@babel/plugin-transform-block-scoping'],
    }),

    // make it possible to import/require index files
    dual(),

    // minify for production
    process.env.NODE_ENV === 'production' &&
      terser({
        compress: {
          ecma: 2017,
          keep_fargs: false,
          passes: 2,
        },
        format: {
          comments: false,
        },
      }),

    // generate package.json files
    generatePackageJson(
      name === ''
        ? // main package.json
          {
            baseContents: (pkg) => ({
              name: pkg.name,
              description: pkg.description,
              version: pkg.version,
              author: pkg.author,
              license: pkg.license,
              repository: pkg.repository,
              bugs: pkg.bugs,
              homepage: pkg.homepage,
              keywords: pkg.keywords,
              peerDependencies: {
                effector: '>=22.0.0',
              },

              // cjs + esm magic
              type: 'module',
              sideEffects: false,
              main: 'index.cjs',
              module: 'index.js',
              'react-native': 'index.js',
              types: 'index.d.ts',
              exports: {
                './package.json': './package.json',
                '.': {
                  require: './index.cjs',
                  import: './index.js',
                  types: './index.d.ts',
                },
                './core/package.json': './core/package.json',
                './core': {
                  require: './core/index.cjs',
                  import: './core/index.js',
                  types: './core/index.d.ts',
                },
                './tools/package.json': './tools/package.json',
                './tools': {
                  require: './tools/index.cjs',
                  import: './tools/index.js',
                  types: './tools/index.d.ts',
                },
                './nil/package.json': './nil/package.json',
                './nil': {
                  require: './nil/index.cjs',
                  import: './nil/index.js',
                  types: './nil/index.d.ts',
                },
                './log/package.json': './log/package.json',
                './log': {
                  require: './log/index.cjs',
                  import: './log/index.js',
                  types: './log/index.d.ts',
                },
                './local/package.json': './local/package.json',
                './local': {
                  require: './local/index.cjs',
                  import: './local/index.js',
                  types: './local/index.d.ts',
                },
                './session/package.json': './session/package.json',
                './session': {
                  require: './session/index.cjs',
                  import: './session/index.js',
                  types: './session/index.d.ts',
                },
                './storage/package.json': './storage/package.json',
                './storage': {
                  require: './storage/index.cjs',
                  import: './storage/index.js',
                  types: './storage/index.d.ts',
                },
                './query/package.json': './query/package.json',
                './query': {
                  require: './query/index.cjs',
                  import: './query/index.js',
                  types: './query/index.d.ts',
                },
                './memory/package.json': './memory/package.json',
                './memory': {
                  require: './memory/index.cjs',
                  import: './memory/index.js',
                  types: './memory/index.d.ts',
                },
                './async-storage/package.json': './async-storage/package.json',
                './async-storage': {
                  require: './async-storage/index.cjs',
                  import: './async-storage/index.js',
                  types: './async-storage/index.d.ts',
                },
                './broadcast/package.json': './broadcast/package.json',
                './broadcast': {
                  require: './broadcast/index.cjs',
                  import: './broadcast/index.js',
                  types: './broadcast/index.d.ts',
                },
                './rn/async/package.json': './rn/async/package.json',
                './rn/async': {
                  require: './rn/async/index.cjs',
                  import: './rn/async/index.js',
                  types: './rn/async/index.d.ts',
                },
                './rn/encrypted/package.json': './rn/encrypted/package.json',
                './rn/encrypted': {
                  require: './rn/encrypted/index.cjs',
                  import: './rn/encrypted/index.js',
                  types: './rn/encrypted/index.d.ts',
                },
              },
            }),
          }
        : // package.json for each submodule, for cjs + esm magic
          {
            baseContents: {
              type: 'module',
              sideEffects: false,
              main: 'index.cjs',
              module: 'index.js',
              'react-native': 'index.js',
              types: 'index.d.ts',
            },
          }
    ),

    // copy license and readme
    name === '' && command([`cp LICENSE ${BUILD}/`, `cp README.md ${BUILD}/`]),
  ],
})

const dts = (name) => ({
  input: `${SRC}/${name}index.ts`,
  output: [
    {
      file: `${BUILD}/${name}index.d.ts`,
      format: 'es',
    },
  ],
  external,
  plugins: [
    generateDts({ respectExternal: true }),
    command(
      [
        `pnpm exec flowgen ${BUILD}/${name}index.d.ts --add-flow-header --no-jsdoc --output-file ${BUILD}/${name}index.js.flow`,
        `pnpm exec prettier --write ${BUILD}/${name}index.d.ts ${BUILD}/${name}index.js.flow`,
      ],
      { wait: true }
    ),
  ],
})

const cjsdts = (name) => ({
  input: `${SRC}/${name}index.ts`,
  output: [
    {
      file: `${BUILD}/${name}index.cjs.d.ts`,
      format: 'es',
    },
  ],
  external,
  plugins: [
    generateDts({ respectExternal: true }),
    command([`pnpm exec prettier --write ${BUILD}/${name}index.cjs.d.ts`], {
      wait: true,
    }),
  ],
})

const entry = (name) => [src(name), dts(name), cjsdts(name)]

export default [
  ...entry(''),
  ...entry('core/'),
  ...entry('tools/'),
  ...entry('nil/'),
  ...entry('log/'),
  ...entry('storage/'),
  ...entry('local/'),
  ...entry('session/'),
  ...entry('query/'),
  ...entry('memory/'),
  ...entry('async-storage/'),
  ...entry('broadcast/'),
  ...entry('rn/async/'),
  ...entry('rn/encrypted/'),
]

function dual() {
  const index = (str, name, extension) =>
    str.replace(name, name.slice(0, -1) + '/index.' + extension + name[0])

  const es = (code) =>
    code
      .replace(
        /(?:^|\n)import\s+?(?:(?:(?:[\w*\s{},$_]*)\s+from\s+?)|)((?:".*?")|(?:'.*?'))[\s]*?(?:;|$|)/g,
        (str, name) => (name.indexOf('.') === 1 ? index(str, name, 'js') : str)
      )
      .replace(
        /(?:^|\n)export\s+?(?:(?:(?:[\w*\s{},$_]*)\s+from\s+?)|)((?:".*?")|(?:'.*?'))[\s]*?(?:;|$|)/g,
        (str, name) => (name.indexOf('.') === 1 ? index(str, name, 'js') : str)
      )

  const cjs = (code) =>
    code.replace(
      /(?:^|\n)(?:let|const|var)\s+(?:{[^}]+}|\S+)\s*=\s*require\(([^)]+)\)/g,
      (str, name) => (name.indexOf('.') === 1 ? index(str, name, 'cjs') : str)
    )

  return {
    name: 'rollup-plugin-dual',
    renderChunk(code, _chunk, { format }) {
      if (format === 'cjs' || format === 'commonjs') {
        code = cjs(code)
      } else if (format === 'es' || format === 'esm' || format === 'module') {
        code = es(code)
      }
      return { code, map: null }
    },
  }
}
