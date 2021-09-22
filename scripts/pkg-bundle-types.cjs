const path = require('path')
const shell = require('shelljs')
const live = require('shelljs-live/promise')
const { getPkgConfig, analyzePkgConfig } = require('./lib/pkg-analyze.cjs')

const rollupConfigPath = path.resolve(__dirname, './config/rollup.cjs')
shell.config.fatal = true
bundlePkgTypes(process.cwd())

async function bundlePkgTypes(dir) {
  const pkgConfig = getPkgConfig(dir)
  const { exportPaths } = analyzePkgConfig(pkgConfig)
  await live(['rollup', '--config', rollupConfigPath])

  shell.rm('tsconfig.tsbuildinfo') // tsbuild cache is invalid now
  shell.cd('dist')
  shell.rm('impl.d.ts.map') // rollup can't product a map, old map is useless

  // generate filenames without directory/extension
  const simpleExportPaths = exportPaths.reduce((accum, exportPath) => {
    accum[path.basename(exportPath).replace(/\..*/, '')] = true
    return accum
  }, {})

  // iterate all top-level files in the 'dist' directory
  // remove anything that's not related to a package export
  for (const filename of shell.ls()) {
    const match = filename.match(/^([^.]*)\./) // everything before first dot
    if (match) {
      if (!simpleExportPaths[match[1]]) { // not listed in package exports
        shell.rm(filename)
      }
    } else { // a directory
      shell.rm('-rf', filename)
    }
  }
}
