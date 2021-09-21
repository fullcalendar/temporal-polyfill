const path = require('path')
const fs = require('fs')
const esbuild = require('esbuild')
const { hideBin } = require('yargs/helpers')
const yargs = require('yargs/yargs')
const exec = require('./lib/exec.cjs').promise.withOptions({ live: true, exitOnError: true })
require('colors')

const argv = yargs(hideBin(process.argv)).argv
bundlePkgJs(argv.watch)

function bundlePkgJs(watch) {
  const packageConfig = require(path.resolve('./package.json'))
  const external = Object.keys(packageConfig.dependencies ?? {})

  // HACK
  if (!fs.existsSync('./src/impl.ts')) {
    return buildJsFile(watch, {
      entryPoints: ['./src/index.ts'],
      outfile: './dist/index.js',
      bundle: true,
      sourcemap: true,
      sourcesContent: false,
      format: 'esm',
      external,
    })
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
  } else {
    promise = promise.then(result => {
      process.on('SIGINT', function() {
        result.stop()
      })
    })
  }

  return promise
}

async function minifyJsFile(filePath) {
  const dirPath = path.dirname(filePath)
  const filename = path.basename(filePath)
  await exec([
    'terser',
    '--config-file', path.resolve(__dirname, '../terser.config.json'),
    '--source-map', `content='${filename}.map',url='${filename}.map'`,
    '--output', filename, // overwrite input!
    '--',
    filename,
  ], {
    cwd: dirPath,
  })
}
