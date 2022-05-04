const path = require('path')
const fs = require('fs/promises')
const { exec } = require('./lib/exec.cjs')

require('colors')
await printPkgSize(process.cwd())

async function printPkgSize(pkgDir) {
  const distDir = path.join(pkgDir, 'dist')
  const filenames = await fs.readdir(distDir)
  let bytes = 0

  for (const filename of filenames) {
    const filePath = path.join(distDir, filename)
    const { stdout } = exec(`gzip -c -r ${filePath} | wc -c`)
    const fileBytes = parseInt(stdout.trim())
    bytes = Math.max(bytes, fileBytes)
  }

  console.log(
    path.basename(pkgDir) + ':',
    bytes
      ? (bytes / 1024).toFixed(3).green + ' kb'
      : 'Empty or nonexistent file'.red,
  )

  if (!bytes) {
    process.exit(1)
  }
}
