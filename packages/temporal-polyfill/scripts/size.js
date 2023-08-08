#!/usr/bin/env node

import { join as joinPaths, dirname } from 'path'
import { readdir } from 'fs/promises'
import { exec as execCb } from 'child_process'
import { promisify } from 'util'

const exec = promisify(execCb)

printSizes(
  joinPaths(dirname(process.argv[1]), '..')
)

async function printSizes(pkgDir) {
  const distDir = joinPaths(pkgDir, 'dist')
  let filenames

  try {
    filenames = await readdir(distDir)
  } catch (ex) {
    process.exit(0)
  }

  for (const filename of filenames) {
    if (filename.match(/\.min\.js$/)) {
      const filePath = joinPaths(distDir, filename)
      const { stdout } = await exec(`gzip -c -r ${filePath} | wc -c`)
      const bytes = parseInt(stdout.trim())

      console.log(
        '  ' + filename + ':',
        (bytes / 1024).toFixed(3) + ' kb'
      )
    }
  }

  console.log()
}
