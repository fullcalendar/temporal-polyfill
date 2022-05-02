const path = require('path')

module.exports = {
  getPkgConfigAtRoot,
  getPkgConfig,
  analyzePkgConfig,
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
