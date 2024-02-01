#!/usr/bin/env node

import { join as joinPaths } from 'path'
import { readdir, rm } from 'fs/promises'

cleanPkg(
  joinPaths(process.argv[1], '../..'),
  process.argv.slice(2).includes('--tsc'),
)

async function cleanPkg(pkgDir, cleanTsc) {
  const distDir = joinPaths(pkgDir, 'dist')
  const files = await readdir(distDir)

  for (const file of files) {
    if (
      file !== '.npmignore' &&
      (cleanTsc || !(file === '.tsc' || file.endsWith('.tsbuildinfo')))
    ) {
      await rm(joinPaths(distDir, file), { recursive: true })
    }
  }

  await rm(joinPaths(pkgDir, 'export-size-output'), {
    recursive: true,
    force: true,
  })
}
