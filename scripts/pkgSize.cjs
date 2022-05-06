const path = require('path')
const fs = require('fs/promises')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)

require('colors')
printPkgSize(process.cwd())

async function printPkgSize(pkgDir) {
  const distDir = path.join(pkgDir, 'dist')
  let filenames
  let bytes = 0

  try {
    filenames = await fs.readdir(distDir)
  } catch (ex) {
    // some projects aren't buildable and don't have a dist directory
    process.exit(0)
  }

  for (const filename of filenames) {
    if (
      !filename.match(/\.map$/) &&
      !filename.match(/\.cjs$/)
    ) {
      const filePath = path.join(distDir, filename)
      const { stdout } = await exec(`gzip -c -r ${filePath} | wc -c`)
      const fileBytes = parseInt(stdout.trim())
      bytes = Math.max(bytes, fileBytes)
    }
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
