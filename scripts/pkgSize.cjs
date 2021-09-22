const path = require('path')
const shell = require('shelljs')
const { getPkgConfig, analyzePkgConfig } = require('./lib/pkgAnalyze.cjs')

require('colors')
printPkgSize(process.cwd())

function printPkgSize(dir) {
  const pkgConfig = getPkgConfig(dir)
  const { exportSubnames } = analyzePkgConfig(pkgConfig)

  const distName = exportSubnames.includes('impl') ? 'impl' : 'index'
  const { stdout } = shell.exec(`gzip -c -r dist/${distName}.js | wc -c`, { silent: true })
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
}
