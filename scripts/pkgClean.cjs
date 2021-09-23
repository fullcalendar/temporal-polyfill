const shell = require('shelljs')

// TODO: ensure this is only ran from a package's root
// Unfortunately allows executing pkg:clean in subdirectory

shell.rm('-rf', [
  'dist',
  'tsconfig.tsbuildinfo', // much faster to delete manually than `tsc --build --clean`
  '*.d.ts', // see pkgExportsFix
])
