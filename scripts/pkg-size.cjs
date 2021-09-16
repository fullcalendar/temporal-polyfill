const path = require('path')
const exec = require('./lib/exec.cjs').sync.withOptions({ exitOnError: true })
require('colors')

const { success, stdout } = exec('gzip -c -r dist/index.js | wc -c')
if (success) {
  const bytes = parseInt(stdout.trim())

  if (!bytes) {
    console.error('Empty or nonexistent file')
    process.exit(1)
  }

  console.log(
    path.basename(process.cwd()),
    (bytes / 1024).toFixed(3).green,
    'kb',
  )
}
