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
  treeshake: {
    annotations: false,
  },
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
          preserve_annotations: true,
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
                effector: '^22.4.0 || ^23.0.0',
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
                  import: {
                    types: './index.d.ts',
                    default: './index.js',
                  },
                  require: {
                    types: './index.d.cts',
                    default: './index.cjs',
                  },
                },
                './core/package.json': './core/package.json',
                './core': {
                  import: {
                    types: './core/index.d.ts',
                    default: './core/index.js',
                  },
                  require: {
                    types: './core/index.d.cts',
                    default: './core/index.cjs',
                  },
                },
                './tools/package.json': './tools/package.json',
                './tools': {
                  import: {
                    types: './tools/index.d.ts',
                    default: './tools/index.js',
                  },
                  require: {
                    types: './tools/index.d.cts',
                    default: './tools/index.cjs',
                  },
                },
                './nil/package.json': './nil/package.json',
                './nil': {
                  import: {
                    types: './nil/index.d.ts',
                    default: './nil/index.js',
                  },
                  require: {
                    types: './nil/index.d.cts',
                    default: './nil/index.cjs',
                  },
                },
                './log/package.json': './log/package.json',
                './log': {
                  import: {
                    types: './log/index.d.ts',
                    default: './log/index.js',
                  },
                  require: {
                    types: './log/index.d.cts',
                    default: './log/index.cjs',
                  },
                },
                './local/package.json': './local/package.json',
                './local': {
                  import: {
                    types: './local/index.d.ts',
                    default: './local/index.js',
                  },
                  require: {
                    types: './local/index.d.cts',
                    default: './local/index.cjs',
                  },
                },
                './session/package.json': './session/package.json',
                './session': {
                  import: {
                    types: './session/index.d.ts',
                    default: './session/index.js',
                  },
                  require: {
                    types: './session/index.d.cts',
                    default: './session/index.cjs',
                  },
                },
                './storage/package.json': './storage/package.json',
                './storage': {
                  import: {
                    types: './storage/index.d.ts',
                    default: './storage/index.js',
                  },
                  require: {
                    types: './storage/index.d.cts',
                    default: './storage/index.cjs',
                  },
                },
                './query/package.json': './query/package.json',
                './query': {
                  import: {
                    types: './query/index.d.ts',
                    default: './query/index.js',
                  },
                  require: {
                    types: './query/index.d.cts',
                    default: './query/index.cjs',
                  },
                },
                './memory/package.json': './memory/package.json',
                './memory': {
                  import: {
                    types: './memory/index.d.ts',
                    default: './memory/index.js',
                  },
                  require: {
                    types: './memory/index.d.cts',
                    default: './memory/index.cjs',
                  },
                },
                './async-storage/package.json': './async-storage/package.json',
                './async-storage': {
                  import: {
                    types: './async-storage/index.d.ts',
                    default: './async-storage/index.js',
                  },
                  require: {
                    types: './async-storage/index.d.cts',
                    default: './async-storage/index.cjs',
                  },
                },
                './broadcast/package.json': './broadcast/package.json',
                './broadcast': {
                  import: {
                    types: './broadcast/index.d.ts',
                    default: './broadcast/index.js',
                  },
                  require: {
                    types: './broadcast/index.d.cts',
                    default: './broadcast/index.cjs',
                  },
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
              exports: {
                './package.json': './package.json',
                '.': {
                  import: {
                    types: './index.d.ts',
                    default: './index.js',
                  },
                  require: {
                    types: './index.d.cts',
                    default: './index.cjs',
                  },
                },
              },
            },
          }
    ),

    // copy license and readme
    name === '' && command([`cp LICENSE ${BUILD}/`, `cp README.md ${BUILD}/`]),

    // copy .npmrc
    process.env.CI_PACKAGE && command([`cp .npmrc ${BUILD}/`]),
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
  plugins: [generateDts({ respectExternal: true })],
})

const cjsdts = (name) => ({
  input: `${SRC}/${name}index.ts`,
  output: [
    {
      file: `${BUILD}/${name}index.d.cts`,
      format: 'es',
    },
  ],
  external,
  plugins: [generateDts({ respectExternal: true })],
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
]

function dual() {
  const index = (str, name, extension) =>
    str.replace(name, `${name.slice(0, -1)}/index.${extension}${name[0]}`)

  const es = (src) =>
    src
      .replace(
        /(?:^|\n)import\s+?(?:(?:(?:[\w*\s{},$_]*)\s+from\s+?)|)((?:".*?")|(?:'.*?'))[\s]*?(?:;|$|)/g,
        (str, name) => (name.indexOf('.') === 1 ? index(str, name, 'js') : str)
      )
      .replace(
        /(?:^|\n)export\s+?(?:(?:(?:[\w*\s{},$_]*)\s+from\s+?)|)((?:".*?")|(?:'.*?'))[\s]*?(?:;|$|)/g,
        (str, name) => (name.indexOf('.') === 1 ? index(str, name, 'js') : str)
      )

  const cjs = (src) =>
    src.replace(
      /(?:^|\n)(?:let|const|var)\s+(?:{[^}]+}|\S+)\s*=\s*require\(([^)]+)\)/g,
      (str, name) => (name.indexOf('.') === 1 ? index(str, name, 'cjs') : str)
    )

  return {
    name: 'rollup-plugin-dual',
    renderChunk(src, _chunk, { format }) {
      let code = src
      if (format === 'cjs' || format === 'commonjs') {
        code = cjs(code)
      } else if (format === 'es' || format === 'esm' || format === 'module') {
        code = es(code)
      }
      return { code, map: null }
    },
  }
}
