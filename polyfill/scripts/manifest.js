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
      import: { types: typesPath, default: esmPath },
      // `module-sync` matches for both `import` and `require()`, so it's less
      // specific than `import` and goes after it, per Node's most-specific-first
      // ordering rule. Order doesn't change what `require()` gets — `import` is
      // mutually exclusive with `require`, so it can never win there — but it
      // does keep `import` resolving through the entry that carries `types`.
      // The point of the condition: without it, `require()` matches none of the
      // keys and fails at resolution with ERR_PACKAGE_PATH_NOT_EXPORTED. Node
      // v22.12+ / v20.19+ then loads this ESM file synchronously, which is only
      // valid because the bundles have no top-level await (otherwise:
      // ERR_REQUIRE_ASYNC_MODULE). Node versions predating require(esm), and
      // bundlers, ignore the condition entirely — they're no worse off than
      // before. Both keys point at one file, so there's no dual-package hazard.
      'module-sync': esmPath,
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
