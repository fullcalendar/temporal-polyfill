const path = require('path')
const fs = require('fs')
const esbuild = require('esbuild')
const { hideBin } = require('yargs/helpers')
const yargs = require('yargs/yargs')
const exec = require('./lib/exec.cjs').promise.withOptions({ live: true, exitOnError: true })
require('colors')

const rollupConfigPath = path.resolve(__dirname, '../rollup.config.js')

const argv = yargs(hideBin(process.argv)).argv
if (argv.watch) {
  bundlePkgJs(true)
} else { // bundle for release
  Promise.all([
    bundlePkgJs(false),
    bundlePkgTypes(),
  ])
}

function bundlePkgJs(watch) {
  const packageConfig = require(path.resolve('./package.json'))
  const external = Object.keys(packageConfig.dependencies ?? {})

  // HACK
  if (!fs.existsSync('./src/impl.ts')) {
    return Promise.resolve()
  }

  return Promise.all([
    buildJsFile(watch, {
      entryPoints: ['./src/impl.ts'],
      outfile: './dist/impl.js',
      bundle: true,
      sourcemap: true,
      sourcesContent: false,
      format: 'esm',
      external,
    }),
    buildJsFile(watch, { // use 'performant' as 'index'
      entryPoints: ['./src/performant.ts'],
      outfile: './dist/index.js',
      bundle: false,
      sourcemap: true,
      sourcesContent: false,
      format: 'esm',
    }),
    buildJsFile(watch, {
      entryPoints: ['./src/shim.ts'],
      outfile: './dist/shim.js',
      bundle: false,
      sourcemap: true,
      sourcesContent: false,
      format: 'esm',
    }),
    buildJsFile(watch, {
      entryPoints: ['./src/global.ts'],
      outfile: './dist/global.js',
      bundle: false,
      sourcemap: true,
      sourcesContent: false,
      format: 'esm',
    }),
  ])
}

function buildJsFile(watch, esbuildConfig) {
  const { outfile } = esbuildConfig
  if (!outfile) {
    throw new Error('esbuild settings much specify outfile')
  }

  if (watch) {
    console.log(`Watch-building ${outfile}...`.green)
    esbuildConfig = {
      ...esbuildConfig,
      watch: {
        onRebuild(error) {
          if (error) {
            console.error(`Error building ${outfile}`.red, error)
          } else {
            console.log(`Rebuilt ${outfile}`.green)
          }
        },
      },
    }
  }

  let promise = esbuild.build(esbuildConfig)
  if (!watch) {
    promise = promise.then(() => {
      console.log(`Built ${outfile}`.green)
    }, (error) => {
      console.error(`Error building ${outfile}`.error, error)
    })

    promise = promise.then(() => minifyJsFile(outfile))
  }

  return promise
}

function minifyJsFile(file) {
  // TODO: terser
  return Promise.resolve()
}

async function bundlePkgTypes() {
  // HACK
  if (!fs.existsSync('./src/impl.ts')) {
    return Promise.resolve() // relative to cwd
  }

  await exec(['rollup', '-c', rollupConfigPath])

  // clear out extra definitions in ./dist
  // 1. remove tsbuild cached data because it will be invalidated
  await exec('rm ./tsconfig.tsbuildinfo')
  // 2. remove all directories
  await exec('find ./dist -mindepth 1 -type d -prune -exec rm -rf {} \\;')
  // 3. remove the 'performant' files (they became the 'index')
  await exec('find ./dist -mindepth 1 -type f -name \'performant.*\' -exec rm -rf {} \\;')
}
