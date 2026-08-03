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

  let rootEsmPath
  let rootTypesPath

  for (const exportPath in exportMap) {
    const exportConfig = exportMap[exportPath]
    const exportName = buildExportName(exportPath)
    const distName = buildExportDistName(exportPath, exportConfig)

    const esmExtension =
      (exportConfig.iife ? extensions.esmWhenIifePrefix : '') + extensions.esm
    const esmPath = './' + distName + esmExtension
    const typesPath = isDev
      ? './.tsc/' +
        (exportConfig.types || exportConfig.src || exportName) +
        extensions.dts
      : './' + distName + extensions.dts

    distExportMap[exportPath] = {
      // `default` lets every resolver select the ESM bundle. Modern Node can
      // load this synchronous module graph from require(), while older Node
      // resolves it first and then reports the more useful ERR_REQUIRE_ESM.
      types: typesPath,
      default: esmPath,
    }

    if (!rootEsmPath) {
      rootEsmPath = esmPath
    }
    if (!rootTypesPath) {
      rootTypesPath = typesPath
    }

    if (exportConfig.iife) {
      const iifePath = './' + distName + extensions.iife
      sideEffectsList.push(iifePath, esmPath)
    }
  }

  distManifest.types = rootTypesPath
  distManifest.main = rootEsmPath
  distManifest.exports = distExportMap
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

function buildExportName(exportPath) {
  return exportPath === '.' ? 'index' : exportPath.replace(/^\.\//, '')
}

function buildExportDistName(exportPath, exportConfig) {
  return exportConfig.dist || buildExportName(exportPath)
}
