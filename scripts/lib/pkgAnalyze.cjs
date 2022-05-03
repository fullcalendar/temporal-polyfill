const path = require('path')
const minimatch = require('minimatch')

module.exports = {
  getPkgConfigAtRoot,
  getPkgConfig,
  analyzePkgConfig,
  analyzePkgConfig2,
}

function getPkgConfigAtRoot() {
  return getPkgConfig(process.cwd())
}

function getPkgConfig(dir) {
  return require(path.join(dir, 'package.json'))
}

function analyzePkgConfig(pkgConfig) {
  const exportObj = pkgConfig.exports || {}
  const exportSubnames = []
  const exportPaths = [] // all paths, including path for '.'

  for (const key in exportObj) {
    const val = exportObj[key]
    const match = key.match(/^\.(\/(.*))?$/)

    if (match) { // a subpath, like '.' or './somthing'
      const subname = match[2]
      if (subname) {
        exportSubnames.push(subname)
      }

      if (typeof val === 'string') {
        exportPaths.push(val)
      } else {
        for (const subkey in val) { // conditions, like 'import' or 'require'
          exportPaths.push(val[subkey])
        }
      }
    } else { // a condition, like 'import' or 'require'
      exportPaths.push(val)
    }
  }

  return { exportSubnames, exportPaths }
}

function analyzePkgConfig2(pkgConfig) {
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
  let globalEntryPoint = ''

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

      for (const sideEffectsGlob of sideEffectsArray) {
        if (minimatch(importPath, sideEffectsGlob)) {
          if (globalEntryPoint) {
            throw new Error('Can only have one sideEffects entry point')
          }
          globalEntryPoint = entryPoint
        }
      }

      entryPointTypes.push(importPathNoExt + '.d.ts')
    }
  }

  return {
    entryPoints, // in src
    entryPointTypes, // in dist
    globalEntryPoint,
    dependencyNames: Object.keys(pkgConfig.dependencies || {}),
  }
}
