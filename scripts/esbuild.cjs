// meant to be run within a package directory

const path = require('path')
const esbuild = require('esbuild')
require('colors')

const { hideBin } = require('yargs/helpers')
const yargs = require('yargs/yargs')
const argv = yargs(hideBin(process.argv)).argv

const packageJson = require(path.resolve('./package.json'))

// No external dependencies bundled
// If we DID want to bundle some, we'd need esbuild-plugin-pnp
const external = Object.keys(packageJson.dependencies ?? {})

buildFile({
  entryPoints: ['./src/index.ts'], // relative to cwd
  outfile: './dist/index.js', // relative to cwd
  bundle: true,
  format: 'esm',
  external,
}, argv.watch)

function buildFile(esbuildSettings, watch) {
  const { outfile } = esbuildSettings
  if (!outfile) {
    throw new Error('esbuild settings much specify outfile')
  }

  if (watch) {
    console.log(`Watch-building ${outfile}...`.green)
    esbuildSettings = {
      ...esbuildSettings,
      watch: {
        onRebuild(error) {
          if (error) {
            console.error(`Error building ${outfile}`, error)
          } else {
            console.log(`Rebuilt ${outfile}`.green)
          }
        },
      },
    }
  }

  let promise = esbuild.build(esbuildSettings)
  if (!watch) {
    promise = promise.then(() => {
      console.log(`Built ${outfile}`.green)
    }, (error) => {
      console.error(`Error building ${outfile}`, error)
    })
  }

  return promise
}
