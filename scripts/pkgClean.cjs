const shell = require('shelljs')
const { getPkgConfigAtRoot } = require('./lib/pkgAnalyze.cjs')

const pkgConfig = getPkgConfigAtRoot() // will throw error if doesn't exist

shell.rm('-rf', [
  'dist',
  'tsconfig.tsbuildinfo', // much faster to delete manually than `tsc --build --clean`
  /*
  HACK to prevent top-level .d.ts files in temporal-spec
  from being deleted
  */
  pkgConfig.name === 'temporal-spec'
    ? null
    : '*.d.ts', // see pkgExportsFix
])
