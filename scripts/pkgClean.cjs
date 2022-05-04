const path = require('path')
const fs = require('fs/promises')
const { getPkgConfig } = require('./lib/pkgAnalyze.cjs')
const { cleanTypeScriptCache, cleanRootTypesHack } = require('./lib/pkgTypes.cjs')

const pkgDir = process.cwd()
const pkgConfig = getPkgConfig(pkgDir)

Promise.all([
  fs.rm(
    path.join(pkgDir, 'dist'),
    { recursive: true, force: true },
  ),
  ...(pkgConfig.entryPointTypes.length && [
    cleanTypeScriptCache(pkgDir),
    cleanRootTypesHack(pkgDir),
  ]),
])
