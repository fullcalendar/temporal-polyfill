// meant to be run within a package directory

const { resolve, relative } = require('path')
const rootPath = resolve('.')
const packageJson = require(relative(
  __dirname,
  resolve(rootPath, './package.json'),
))

require('colors')

const { build } = require('esbuild')

// No external dependencies bundled
// If we DID want to bundle some, we'd need esbuild-plugin-pnp
const external = Object.keys(packageJson.dependencies ?? {})

build({
  entryPoints: [resolve(rootPath, './src/index.ts')],
  outfile: resolve(rootPath, './dist/index.js'),
  bundle: true,
  format: 'esm',
  external,
})
  .then(() => {
    console.log('Main file built'.green)
  })
  .catch((err) => {
    console.warn('Building main file failed'.red)
    console.warn(err)
    process.exit(1)
  })
