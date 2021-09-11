const { resolve, relative } = require('path')
const rootPath = resolve('.')
const packageJson = require(relative(
  __dirname,
  resolve(rootPath, './package.json'),
))

require('colors')

const { build } = require('esbuild')

// Yarn PnP support for esbuild
// const { pnpPlugin } = require('@yarnpkg/esbuild-plugin-pnp')

// No external dependencies bundled
const external = Object.keys(packageJson.dependencies ?? {})

build({
  entryPoints: [resolve(rootPath, './src/index.ts')],
  outfile: resolve(rootPath, './dist/index.js'),
  bundle: true,
  format: 'esm',
  external,
  // plugins: [pnpPlugin()],
})
  .then(() => {
    console.log('Main file built'.green)
  })
  .catch((err) => {
    console.warn('Building main file failed'.red)
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
    console.log('Minified file built'.green)
  })
  .catch((err) => {
    console.warn('Building minified file failed'.red)
    console.warn(err)
    process.exit(1)
  })
