#!/usr/bin/env node

import { join as joinPaths } from 'path'
import { readFile, writeFile } from 'fs/promises'

writePkgJson(
  joinPaths(process.argv[1], '../..')
)

async function writePkgJson(pkgDir) {
  const srcPkgJsonPath = joinPaths(pkgDir, 'package.json')
  const distPkgJsonPath = joinPaths(pkgDir, 'dist/package.json')

  const srcPkgJson = JSON.parse(await readFile(srcPkgJsonPath))
  const distPkgJson = { ...srcPkgJson }

  const srcExportMap = srcPkgJson.buildConfig.exports
  const distExportMap = {}

  for (const exportPath in srcExportMap) {
    const shortName = exportPath === '.' ? './index' : exportPath

    // TODO: make DRY with bundle.js
    distExportMap[exportPath] = {
      types: shortName + '.d.ts',
      require: shortName + '.cjs',
      import: shortName + '.esm.js',
    }
  }

  distPkgJson.types = distExportMap['.'].types
  distPkgJson.main = distExportMap['.'].require
  distPkgJson.module = distExportMap['.'].import
  distPkgJson.unpkg = distPkgJson.jsdelivr = './global.min.js'
  distPkgJson.exports = distExportMap

  delete distPkgJson.private
  delete distPkgJson.scripts
  delete distPkgJson.buildConfig
  delete distPkgJson.publishConfig
  delete distPkgJson.devDependencies

  await writeFile(distPkgJsonPath, JSON.stringify(distPkgJson, undefined, 2))
}
