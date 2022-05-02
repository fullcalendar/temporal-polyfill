/*
HACK to overcome export maps not working in TypeScript
https://github.com/microsoft/TypeScript/issues/33079
Writes .d.ts files in root of package, referencing ./dist/*

When removing this hack, grep the codebase for 'pkgExportsFix'
Also, remove package.json::files entry for "/*.d.ts"
*/
const shell = require('shelljs')
const { getPkgConfig, analyzePkgConfig } = require('./lib/pkgAnalyze.cjs')

shell.config.fatal = true
doExportsFix(process.cwd())

function doExportsFix(dir) {
  const pkgConfig = getPkgConfig(dir)
  const { exportSubnames } = analyzePkgConfig(pkgConfig)

  for (const exportSubname of exportSubnames) {
    new shell.ShellString(buildDtsCode(exportSubname))
      .to(`${exportSubname}.d.ts`)
  }
}

function buildDtsCode(exportSubname) {
  return `export * from './dist/${exportSubname}'\n`
  // export default as default ???
}
