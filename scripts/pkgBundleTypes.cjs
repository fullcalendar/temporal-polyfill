const path = require('path')
const shell = require('shelljs')
const live = require('shelljs-live/promise')
const { removeExt } = require('./lib/path.cjs')
const { getPkgConfig, analyzePkgConfig } = require('./lib/pkgAnalyze.cjs')

const rollupConfigPath = path.resolve(__dirname, './config/pkgRollupTypes.cjs')
shell.config.fatal = true
bundlePkgTypes(process.cwd())

async function bundlePkgTypes(dir) {
  const pkgConfig = getPkgConfig(dir)
  const { exportPaths } = analyzePkgConfig(pkgConfig)

  await live(['rollup', '--config', rollupConfigPath])

  shell.rm('tsconfig.tsbuildinfo') // tsbuild cache is invalid now
  shell.cd('dist') // in 'dist' directory from now on!...

  // generate filenames without directory/extension
  const exportDistNames = exportPaths.reduce((accum, exportPath) => {
    accum[removeExt(path.basename(exportPath))] = true
    return accum
  }, {})

  // iterate all top-level files in the 'dist' directory
  // remove anything that's not related to a package export
  for (const filename of shell.ls()) {
    if (filename.indexOf('.') === -1) { // directory
      shell.rm('-rf', filename)
    } else if (!exportDistNames[removeExt(filename)]) { // not listed in package exports
      shell.rm(filename)
    }
  }

  // remove .d.ts sourcemaps and their references
  // impossible to do with tsc flags
  shell.rm('*.d.ts.map')
  shell.sed('-i', /^\/\/#\s*sourceMappingURL=.*/, '', '*.d.ts')
}
