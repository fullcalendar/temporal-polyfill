const shell = require('shelljs')

shell.rm('-rf', [
  'dist',
  'tsconfig.tsbuildinfo', // much faster to delete manually than `tsc --build --clean`
])
