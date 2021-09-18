const exec = require('./lib/exec.cjs').sync.withOptions({ live: true, exitOnError: true })

exec([
  'rm', '-rf',
  'dist',
  'tsconfig.tsbuildinfo', // much faster to delete manually than `tsc --build --clean`
])
