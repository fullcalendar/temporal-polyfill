#!/usr/bin/env node

import { join as joinPaths } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { extensions } from './lib/config.js'

writePkgJson(
  joinPaths(process.argv[1], '../..'),
  process.argv.slice(2).includes('--dev'),
)

async function writePkgJson(pkgDir, isDev) {
  const srcManifestPath = joinPaths(pkgDir, 'package.json')
  const distManifestPath = joinPaths(pkgDir, 'dist/package.json')

  const srcManifest = JSON.parse(await readFile(srcManifestPath))
  const distManifest = { ...srcManifest }

  const exportMap = srcManifest.buildConfig.exports
  const distExportMap = {}
  const sideEffectsList = []
  let iifeMinPath

  for (const exportPath in exportMap) {
    const exportConfig = exportMap[exportPath]
    const exportName =
      exportPath === '.' ? 'index' : exportPath.replace(/^\.\//, '')

    distExportMap[exportPath] = {
      types: !isDev
        ? './' + exportName + extensions.dts
        : './.tsc/' +
          (exportConfig.types || exportConfig.src || exportName) +
          extensions.dts,

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

  distManifest.types = distExportMap['.'].types
  distManifest.main = distExportMap['.'].require
  distManifest.module = distExportMap['.'].import

  if (iifeMinPath) {
    distManifest.unpkg = distManifest.jsdelivr = iifeMinPath
  }

  distManifest.exports = distExportMap
  distManifest.sideEffects = sideEffectsList.length ? sideEffectsList : false

  delete distManifest.private
  delete distManifest.scripts
  delete distManifest.buildConfig
  delete distManifest.publishConfig
  delete distManifest.devDependencies
  delete distManifest.disabledBuildConfig // temporary

  await writeFile(distManifestPath, JSON.stringify(distManifest, undefined, 2))
}
