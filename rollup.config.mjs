import { nodeResolve } from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import terser from '@rollup/plugin-terser'
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
              name: process.env.CI_PACKAGE
                ? `@${process.env.GITHUB_REPOSITORY_OWNER}/${pkg.name}`
                : pkg.name,
              description: pkg.description,
              version: process.env.CI_PACKAGE
                ? `${pkg.version}-${process.env.GITHUB_SHA}`
                : pkg.version,
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
              types: 'index.d.ts',
              module: 'index.js',
              main: 'index.cjs',
              'react-native': 'index.js',
              exports: {
                './package.json': './package.json',
                '.': {
                  types: './index.d.ts',
                  import: './index.js',
                  require: './index.cjs',
                },
                './core/package.json': './core/package.json',
                './core': {
                  types: './core/index.d.ts',
                  import: './core/index.js',
                  require: './core/index.cjs',
                },
                './tools/package.json': './tools/package.json',
                './tools': {
                  types: './tools/index.d.ts',
                  import: './tools/index.js',
                  require: './tools/index.cjs',
                },
                './nil/package.json': './nil/package.json',
                './nil': {
                  types: './nil/index.d.ts',
                  import: './nil/index.js',
                  require: './nil/index.cjs',
                },
                './log/package.json': './log/package.json',
                './log': {
                  types: './log/index.d.ts',
                  import: './log/index.js',
                  require: './log/index.cjs',
                },
                './local/package.json': './local/package.json',
                './local': {
                  types: './local/index.d.ts',
                  import: './local/index.js',
                  require: './local/index.cjs',
                },
                './session/package.json': './session/package.json',
                './session': {
                  types: './session/index.d.ts',
                  import: './session/index.js',
                  require: './session/index.cjs',
                },
                './storage/package.json': './storage/package.json',
                './storage': {
                  types: './storage/index.d.ts',
                  import: './storage/index.js',
                  require: './storage/index.cjs',
                },
                './query/package.json': './query/package.json',
                './query': {
                  types: './query/index.d.ts',
                  import: './query/index.js',
                  require: './query/index.cjs',
                },
                './memory/package.json': './memory/package.json',
                './memory': {
                  types: './memory/index.d.ts',
                  import: './memory/index.js',
                  require: './memory/index.cjs',
                },
                './async-storage/package.json': './async-storage/package.json',
                './async-storage': {
                  types: './async-storage/index.d.ts',
                  import: './async-storage/index.js',
                  require: './async-storage/index.cjs',
                },
                './broadcast/package.json': './broadcast/package.json',
                './broadcast': {
                  types: './broadcast/index.d.ts',
                  import: './broadcast/index.js',
                  require: './broadcast/index.cjs',
                },
                './rn/async/package.json': './rn/async/package.json',
                './rn/async': {
                  types: './rn/async/index.d.ts',
                  import: './rn/async/index.js',
                  require: './rn/async/index.cjs',
                },
                './rn/encrypted/package.json': './rn/encrypted/package.json',
                './rn/encrypted': {
                  types: './rn/encrypted/index.d.ts',
                  import: './rn/encrypted/index.js',
                  require: './rn/encrypted/index.cjs',
                },
              },
            }),
          }
        : // package.json for each submodule, for cjs + esm magic
          {
            baseContents: {
              type: 'module',
              sideEffects: false,
              types: 'index.d.ts',
              module: 'index.js',
              main: 'index.cjs',
              'react-native': 'index.js',
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
