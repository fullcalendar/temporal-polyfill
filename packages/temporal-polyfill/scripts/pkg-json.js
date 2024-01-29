#!/usr/bin/env node

import { join as joinPaths } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { extensions } from './lib/config.js'

writePkgJson(
  joinPaths(process.argv[1], '../..'),
  process.argv.slice(2).includes('--dev'),
)

async function writePkgJson(pkgDir, isDev) {
  const srcPkgJsonPath = joinPaths(pkgDir, 'package.json')
  const distPkgJsonPath = joinPaths(pkgDir, 'dist/package.json')

  const srcPkgJson = JSON.parse(await readFile(srcPkgJsonPath))
  const distPkgJson = { ...srcPkgJson }

  const exportMap = srcPkgJson.buildConfig.exports
  const distExportMap = {}
  const sideEffectsList = []
  let iifeMinPath

  for (const exportPath in exportMap) {
    const exportConfig = exportMap[exportPath]
    const exportName = exportPath === '.' ? 'index' : exportPath.replace(/^\.\//, '')

    distExportMap[exportPath] = {
      types: !isDev || exportConfig.types
        ? './' + exportName + extensions.dts
        : './.tsc/' + (exportConfig.src || exportName) + extensions.dts,

      require: './' + exportName + extensions.cjs,
      import: './' + exportName + extensions.esm,
      default: './' + exportName + extensions.esm,
    }

    if (exportConfig.iife) {
      sideEffectsList.push(
        './' + exportName + extensions.cjs,
        './' + exportName + extensions.esm,
        './' + exportName + extensions.iife,
        './' + exportName + extensions.iifeMin,
      )
      if (!iifeMinPath) {
        iifeMinPath = './' + exportName + extensions.iifeMin
      }
    }
  }

  distPkgJson.types = distExportMap['.'].types
  distPkgJson.main = distExportMap['.'].require
  distPkgJson.module = distExportMap['.'].import

  if (iifeMinPath) {
    distPkgJson.unpkg =
      distPkgJson.jsdelivr = iifeMinPath
  }

  distPkgJson.exports = distExportMap
  distPkgJson.sideEffects = sideEffectsList.length
    ? sideEffectsList
    : false

  delete distPkgJson.private
  delete distPkgJson.scripts
  delete distPkgJson.buildConfig
  delete distPkgJson.publishConfig
  delete distPkgJson.devDependencies

  await writeFile(distPkgJsonPath, JSON.stringify(distPkgJson, undefined, 2))
}
