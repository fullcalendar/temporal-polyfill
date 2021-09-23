const shell = require('shelljs')
const { checkAtPkgRoot } = require('./lib/pkgAnalyze.cjs')

checkAtPkgRoot()
shell.rm('-rf', [
  'dist',
  'tsconfig.tsbuildinfo', // much faster to delete manually than `tsc --build --clean`
  '*.d.ts', // see pkgExportsFix
])
