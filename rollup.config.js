import { terser } from 'rollup-plugin-terser'
import babel from '@rollup/plugin-babel'
import command from 'rollup-plugin-command'
import generateDts from 'rollup-plugin-dts'
import generatePackageJson from 'rollup-plugin-generate-package-json'

const SRC = 'src'
const BUILD = 'build'

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
      format: 'esm',
      sourcemap: process.env.NODE_ENV === 'production',
      exports: 'named',
    },
  ],
  external: ['effector', '..', '../storage'],
  plugins: [
    babel({
      extensions: ['.ts'],
      babelHelpers: 'bundled',
      presets: ['@babel/preset-typescript'],
      plugins: ['@babel/plugin-transform-block-scoping'],
    }),

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
              dependencies: pkg.dependencies,

              // cjs + esm magic
              type: 'module',
              main: 'index.cjs',
              module: 'index.js',
              'react-native': 'index.js',
              exports: {
                './package.json': './package.json',
                '.': {
                  require: './index.cjs',
                  import: './index.js',
                },
                './fp/package.json': './fp/package.json',
                './fp': {
                  require: './fp/index.cjs',
                  import: './fp/index.js',
                },
                './local/package.json': './local/package.json',
                './local': {
                  require: './local/index.cjs',
                  import: './local/index.js',
                },
                './local/fp/package.json': './local/fp/package.json',
                './local/fp': {
                  require: './local/fp/index.cjs',
                  import: './local/fp/index.js',
                },
                './session/package.json': './session/package.json',
                './session': {
                  require: './session/index.cjs',
                  import: './session/index.js',
                },
                './session/fp/package.json': './session/fp/package.json',
                './session/fp': {
                  require: './session/fp/index.cjs',
                  import: './session/fp/index.js',
                },
                './storage/package.json': './storage/package.json',
                './storage': {
                  require: './storage/index.cjs',
                  import: './storage/index.js',
                },
              },
            }),
          }
        : // package.json for each submodule, for cjs + esm magic
          {
            baseContents: {
              type: 'module',
              main: 'index.cjs',
              module: 'index.js',
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
  external: ['effector', '..', '../storage'],
  plugins: [
    generateDts({ respectExternal: true }),
    command(
      [
        `yarn flowgen ${BUILD}/${name}index.d.ts --add-flow-header --no-jsdoc --output-file ${BUILD}/${name}index.js.flow`,
        `yarn prettier --write ${BUILD}/${name}index.d.ts ${BUILD}/${name}index.js.flow`,
      ],
      { wait: true }
    ),
  ],
})

const entry = (name) => [src(name), dts(name)]

export default [
  ...entry(''),
  ...entry('fp/'),
  ...entry('storage/'),
  ...entry('local/'),
  ...entry('local/fp/'),
  ...entry('session/'),
  ...entry('session/fp/'),
]
