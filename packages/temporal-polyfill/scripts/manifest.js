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

  let rootCjsPath
  let rootEsmPath
  let rootTypesPath
  let rootIifeMinPath

  for (const exportPath in exportMap) {
    const exportConfig = exportMap[exportPath]
    const exportName =
      exportPath === '.' ? 'index' : exportPath.replace(/^\.\//, '')

    const esmExtension =
      (exportConfig.iife ? extensions.esmWhenIifePrefix : '') + extensions.esm
    const esmPath = './' + exportName + esmExtension
    const cjsPath = './' + exportName + extensions.cjs
    const typesPath = isDev
      ? './.tsc/' +
        (exportConfig.types || exportConfig.src || exportName) +
        extensions.dts
      : './' + exportName + extensions.dts

    distExportMap[exportPath] = {
      require: cjsPath,
      import: isDev ? { types: typesPath, default: esmPath } : esmPath,
    }

    if (!rootCjsPath) {
      rootCjsPath = cjsPath
    }
    if (!rootEsmPath) {
      rootEsmPath = esmPath
    }
    if (!rootTypesPath) {
      rootTypesPath = typesPath
    }

    if (exportConfig.iife) {
      sideEffectsList.push(
        './' + exportName + extensions.cjs,
        './' + exportName + esmExtension,
        './' + exportName + extensions.iife,
        './' + exportName + extensions.iifeMin,
      )

      if (!rootIifeMinPath) {
        rootIifeMinPath = './' + exportName + extensions.iifeMin
      }
    }
  }

  distManifest.main = rootCjsPath
  distManifest.types = rootTypesPath
  distManifest.module = rootEsmPath
  distManifest.exports = distExportMap

  if (rootIifeMinPath) {
    distManifest.unpkg = distManifest.jsdelivr = rootIifeMinPath
  }

  distManifest.sideEffects = sideEffectsList.length ? sideEffectsList : false

  delete distManifest.private
  delete distManifest.scripts
  delete distManifest.buildConfig
  delete distManifest.publishConfig
  delete distManifest.devDependencies
  delete distManifest.devDependenciesNotes
  delete distManifest.disabledBuildConfig // temporary

  await writeFile(distManifestPath, JSON.stringify(distManifest, undefined, 2))
}
