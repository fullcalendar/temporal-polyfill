const path = require('path')
const minimatch = require('minimatch')

module.exports = {
  getPkgConfig,
  analyzePkgConfig,
}

function getPkgConfig(dir) {
  return require(path.join(dir, 'package.json'))
}

function analyzePkgConfig(pkgConfig) {
  if (pkgConfig.type !== 'module') {
    throw new Error('In package.json, must specify "type":"module"')
  }
  ['main', 'module', 'types'].forEach((prop) => {
    if (!pkgConfig[prop]) {
      throw new Error(`In package.json, must specify "${prop}"`)
    }
  })

  const exportsHash = pkgConfig.exports || {}
  const defaultExport = exportsHash['.']

  if (typeof defaultExport !== 'object' || !defaultExport) {
    throw new Error('Must specify default "." export')
  }
  if (defaultExport.import !== pkgConfig.module) {
    throw new Error('default export must be consistent with pkg.module')
  }
  if (defaultExport.require !== pkgConfig.main) {
    throw new Error('default export must be consistent with pkg.main')
  }

  const sideEffectsArray = Array.isArray(pkgConfig.sideEffects) ? pkgConfig.sideEffects : []
  const entryPoints = []
  const entryPointTypes = []
  const globalEntryPoints = []

  for (const exportId in exportsHash) {
    const exportPaths = exportsHash[exportId]
    const importPath = exportPaths.import || ''
    const requirePath = exportPaths.require || ''
    const importPathNoExt = importPath.replace(/\.mjs$/, '')
    const requirePathNoExt = requirePath.replace(/\.cjs$/, '')

    if (importPathNoExt !== requirePathNoExt) {
      throw new Error('Inconsistent "import" and "require"')
    }

    const match = importPathNoExt.match(/\.\/dist\/(.*)$/)
    if (match) {
      const entryPoint = './src/' + match[1] + '.ts'
      entryPoints.push(entryPoint)
      entryPointTypes.push(importPathNoExt + '.d.ts')

      for (const sideEffectsGlob of sideEffectsArray) {
        if (minimatch(importPath, sideEffectsGlob)) {
          globalEntryPoints.push(entryPoint)
          break
        }
      }
    }
  }

  return {
    entryPoints, // in src
    entryPointTypes, // in dist
    globalEntryPoints,
    dependencyNames: Object.keys(pkgConfig.dependencies || {}),
  }
}
