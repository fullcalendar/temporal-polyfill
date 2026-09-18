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

    // IIFE entries (./global and ./full/global) ship two build artifacts:
    // - global.esm.js  — the ESM bundle (used by modern bundlers and Node ESM)
    // - global.cjs     — the IIFE/UMD bundle (safe to load in any CJS context)
    //
    // Expose the IIFE artifact via the "require" condition so that:
    //   - require('temporal-polyfill/global') works in plain CJS modules
    //   - Jest, Vitest vmForks, and Vite SSR (which parse node_modules deps as
    //     strict CJS in isolated VM contexts) don't hit
    //     "Cannot use import statement outside a module"
    //
    // For all other exports (ESM-only), we keep the existing behaviour: no
    // "require" condition, letting `default` cover all resolvers. Modern
    // Node 22+ can require() an ESM graph; older Node gets ERR_REQUIRE_ESM.
    const requirePath = exportConfig.iife
      ? './' + distName + extensions.iife
      : undefined

    distExportMap[exportPath] = {
      types: typesPath,
      ...(requirePath ? { require: requirePath } : {}),
      // `default` lets every resolver select the ESM bundle. Modern Node can
      // load this synchronous module graph from require(), while older Node
      // resolves it first and then reports the more useful ERR_REQUIRE_ESM.
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
