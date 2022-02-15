const path = require('path')
const esbuild = require('esbuild')
const { hideBin } = require('yargs/helpers')
const yargs = require('yargs/yargs')
const shell = require('shelljs')
const live = require('shelljs-live/promise')
const { getPkgConfig, analyzePkgConfig } = require('./lib/pkgAnalyze.cjs')
const { cjsPathTransform, mjsPathTransform } = require('./lib/pathTransform.cjs')

const terserConfigPath = path.resolve(__dirname, './config/terser.json')
const argv = yargs(hideBin(process.argv)).argv
shell.config.fatal = true
require('colors')
bundlePkgJS(process.cwd(), argv.watch)

function bundlePkgJS(dir, watch) {
  const pkgConfig = getPkgConfig(dir)
  const { exportSubnames, exportPaths } = analyzePkgConfig(pkgConfig)
  const external = Object.keys(pkgConfig.dependencies ?? {})
  const isPolyfill = exportSubnames.includes('impl')

  return Promise.all(exportPaths.map((exportPath) => {
    const match = exportPath.match(/^\.\/dist\/(.*)\.(c?js)$/)
    if (!match) {
      throw new Error(`Invalid export path '${exportPath}'`)
    }

    const ext = match[2]
    const distName = match[1]
    const srcPath = isPolyfill && distName === 'index'
      ? './src/performant.ts'
      : `./src/${distName}.ts`
    let bundle

    if (isPolyfill) {
      bundle = distName === 'impl' || (ext === 'js' && distName === 'global')
    } else {
      bundle = distName === 'index'
    }

    if (ext === 'js') {
      const config = {
        entryPoints: [srcPath],
        outfile: exportPath,
        format: 'esm',
        bundle: true, // mjsPathTransform needs for bundling
        external,
        sourcemap: true, // separate .js.map, content included by default
        plugins: bundle ? [] : [mjsPathTransform], // plugin will prevent bundling
      }
      if (watch) {
        return watchJSFile(config)
      } else {
        return buildJSFile(config, true) // minify=true
      }
    } else if (!watch) { // .cjs
      return buildJSFile({
        entryPoints: [srcPath],
        outfile: exportPath,
        format: 'cjs',
        bundle: true, // cjsPathTransform needs bundling
        external,
        plugins: bundle ? [] : [cjsPathTransform], // plugin will prevent bundling
      }, false) // minify=false
    }
    return Promise.resolve()
  }))
}

function buildJSFile(config, minify) {
  const { outfile } = config
  return esbuild.build(config).then(() => {
    return (minify ? minifyJSFile(outfile) : Promise.resolve()).then(() => {
      console.log(`Built ${outfile}`.green)
    })
  }, (error) => {
    console.error(`Error building ${outfile}`.red, error)
  })
}

function watchJSFile(config) {
  const { outfile } = config
  console.log(`Watch-building ${outfile}...`.green)
  return esbuild.build({
    ...config,
    watch: {
      onRebuild(error) {
        if (error) {
          console.error(`Error building ${outfile}`.red, error)
        } else {
          console.log(`Rebuilt ${outfile}`.green)
        }
      },
    },
  }).then((watching) => {
    process.on('SIGINT', function() {
      watching.stop()
    })
  })
}

/*
TODO: fix Calendar2 problem
*/
async function minifyJSFile(filePath) {
  const dirPath = path.dirname(filePath)
  const filename = path.basename(filePath)
  await live([
    'terser',
    '--config-file', terserConfigPath,
    '--source-map', `content='${filename}.map',url='${filename}.map'`,
    '--output', filename, // overwrite input!
    '--',
    filename,
  ], {
    cwd: dirPath,
  })
}
