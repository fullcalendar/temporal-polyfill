const path = require('path')
const shell = require('shelljs')

require('colors')

const { stdout } = shell.exec('gzip -c -r dist/impl.js | wc -c', { silent: true })
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
