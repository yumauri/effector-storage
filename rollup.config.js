import esbuild from 'rollup-plugin-esbuild'
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
    },
    {
      file: `${BUILD}/${name}index.js`,
      format: 'es',
      sourcemap: process.env.NODE_ENV === 'production',
    },
  ],
  external: ['effector', '..', '../storage'],
  plugins: [
    esbuild({
      target: 'es2017',

      // looks like fail build sometimes, should I add terser instead?
      minify: process.env.NODE_ENV === 'production',

      // looks like broken?
      // https://github.com/egoist/rollup-plugin-esbuild/issues/76
      // sourceMap: process.env.NODE_ENV === 'production',

      // define: {
      //   __VERSION__: '"x.y.z"'
      // },
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
              peerDependencies: pkg.peerDependencies,
              // sideEffects: false,

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
                './local/package.json': './local/package.json',
                './local': {
                  require: './local/index.cjs',
                  import: './local/index.js',
                },
                './session/package.json': './session/package.json',
                './session': {
                  require: './session/index.cjs',
                  import: './session/index.js',
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

    // copy license
    name === '' && command(`cp ./{LICENSE,README.md} ${BUILD}/`),
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
  ...entry('storage/'),
  ...entry('local/'),
  ...entry('session/'),
]
