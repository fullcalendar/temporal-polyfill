const path = require('path')
const fs = require('fs/promises')
const { getPkgConfig, analyzePkgConfig } = require('./lib/pkgAnalyze.cjs')
const { cleanTypeScriptCache, cleanRootTypesHack } = require('./lib/pkgTypes.cjs')

const pkgDir = process.cwd()
const pkgConfig = getPkgConfig(pkgDir)
const pkgAnalysis = analyzePkgConfig(pkgConfig)

Promise.all([
  fs.rm(
    path.join(pkgDir, 'dist'),
    { recursive: true, force: true },
  ),
  ...(pkgAnalysis.entryPointTypes.length && [
    cleanTypeScriptCache(pkgDir),
    cleanRootTypesHack(pkgDir),
  ]),
])
