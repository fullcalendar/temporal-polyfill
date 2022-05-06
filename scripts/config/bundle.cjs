const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const { buildPkgBundleConfigs } = require('../lib/pkgBundle.cjs')

module.exports = async(commandLineArgs) => {
  const pkgDirs = await getPkgDirs()
  const configs = []

  for (const pkgDir of pkgDirs) {
    const pkgBundleConfigs = await buildPkgBundleConfigs(pkgDir, commandLineArgs)
    configs.push(...pkgBundleConfigs)
  }

  return configs
}

async function getPkgDirs() {
  const { stdout } = await exec('yarn workspaces list --json')
  const lines = stdout.trim().split('\n')
  return lines.map((line) => JSON.parse(line).location)
    .filter((path) => path !== '.')
}
