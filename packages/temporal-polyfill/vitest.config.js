import {
  dirname,
  isAbsolute,
  join as joinPaths,
  resolve as resolvePath,
} from 'path'
import { readFile } from 'fs/promises'
import { defineConfig } from 'vitest/config'
import { extensions } from './scripts/lib/config'

export default defineConfig(async () => {
  const isDev = /:(dev|debug)$/.test(process.env.npm_lifecycle_event || '')

  return {
    test: {
      include: ['src/**/*.test.ts'],
    },
    plugins: [
      !isDev && entryPointResolve(JSON.parse(await readFile('./package.json'))),
    ],
  }
})

function entryPointResolve(manifest) {
  const remaps = {}
  const exportConfigMap = manifest.buildConfig.exports

  for (const exportPath in exportConfigMap) {
    const exportConfig = exportConfigMap[exportPath]
    const exportName =
      exportPath === '.' ? 'index' : exportPath.replace(/^\.\//, '')

    const esmExtension =
      (exportConfig.iife ? extensions.esmWhenIifePrefix : '') + extensions.esm

    const srcPath = resolvePath('src', (exportConfig.src || exportName) + '.ts')
    const distPath = resolvePath('dist', exportName + esmExtension)

    remaps[srcPath] = distPath
  }

  return {
    name: 'entry-point-resolve',
    enforce: 'pre',
    resolveId(importId, importerPath, { isEntry }) {
      const importPath = !isEntry && computeImportPath(importId, importerPath)
      if (importPath) {
        return remaps[importPath] || remaps[importPath + '.ts']
      }
    },
  }
}

function computeImportPath(importId, importerPath) {
  if (isAbsolute(importId)) {
    return importId
  }
  if (isImportRelative(importId)) {
    return importerPath
      ? joinPaths(dirname(importerPath), importId)
      : resolvePath(importId) // from CWD
  }
  // otherwise, probably an external dependency
}

function isImportRelative(importId) {
  return importId.startsWith('./') || importId.startsWith('../')
}
