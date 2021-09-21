const path = require('path')
const exec = require('./lib/exec.cjs').sync.withOptions({ exitOnError: true })
require('colors')

const { stdout } = exec('gzip -c -r dist/impl.js | wc -c')
const bytes = parseInt(stdout.trim())

console.log(
  path.basename(process.cwd()) + ':',
  bytes
    ? (bytes / 1024).toFixed(3).green + ' kb'
    : 'Empty or nonexistent file'.red,
)

if (!bytes) {
  process.exit(1)
}
