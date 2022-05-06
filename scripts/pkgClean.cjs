const path = require('path')
const fs = require('fs/promises')
const { getPkgConfig, analyzePkgConfig } = require('./lib/pkgAnalyze.cjs')
const { cleanTypeScriptCache, cleanRootTypesHack } = require('./lib/pkgTypes.cjs')

async function clean() {
  const pkgDir = process.cwd()
  const pkgConfig = await getPkgConfig(pkgDir)
  const pkgAnalysis = analyzePkgConfig(pkgConfig)
  const promises = []

  promises.push(
    fs.rm(
      path.join(pkgDir, 'dist'),
      { recursive: true, force: true },
    ),
  )

  // has generated types?
  if (pkgAnalysis.entryPointTypes.length) {
    promises.push(cleanTypeScriptCache(pkgDir))
    promises.push(cleanRootTypesHack(pkgDir))
  }

  return Promise.all(promises)
}

clean()
