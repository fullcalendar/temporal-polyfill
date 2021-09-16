const path = require('path')
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
    bundlePkgTypes()
  ])
}

function bundlePkgJs(watch) {
  const packageConfig = require(path.resolve('./package.json'))
  const external = Object.keys(packageConfig.dependencies ?? {})

  return buildJsFile(watch, {
    entryPoints: ['./src/index.ts'], // relative to cwd
    outfile: './dist/index.js', // relative to cwd
    bundle: true,
    format: 'esm',
    external,
  })
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
  console.log('TODO: terser on ' + file)
  return Promise.resolve()
}

async function bundlePkgTypes() {
  await exec(['rollup', '-c', rollupConfigPath])
  await exec(['echo', 'TODO: cleanup extra type files!'])
  // rm -f dist/?(!(index)).d.ts || true
}
