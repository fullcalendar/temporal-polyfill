/* eslint-disable @typescript-eslint/no-var-requires */

const { resolve } = require('path')
const rootPath = resolve('.')

const { build } = require('esbuild')

// Yarn PnP support for esbuild
// const { pnpPlugin } = require('@yarnpkg/esbuild-plugin-pnp')

// Support external arguments
const external = [
  process.argv
    .find((val) => {
      return val.match(/exclude=(.*)/)
    })
    ?.split('=')[1],
]

build({
  entryPoints: [resolve(rootPath, './src/index.ts')],
  outfile: resolve(rootPath, './dist/index.js'),
  bundle: true,
  format: 'esm',
  external,
  // plugins: [pnpPlugin()],
})
  .then(() => {
    console.log('Main file built')
  })
  .catch((err) => {
    console.warn('Building main file failed')
    console.warn(err)
    process.exit(1)
  })

build({
  entryPoints: [resolve(rootPath, './src/index.ts')],
  outfile: resolve(rootPath, './dist/index.min.js'),
  bundle: true,
  minify: true,
  format: 'esm',
  external,
  // plugins: [pnpPlugin()],
})
  .then(() => {
    console.log('Minified file built')
  })
  .catch((err) => {
    console.warn('Building minified file failed')
    console.warn(err)
    process.exit(1)
  })

// "tsc && node ./esbuild.config.cjs",
