const { buildPkgBundleConfigs } = require('../lib/pkgBundle.cjs')

module.exports = async(commandLineArgs) => {
  return buildPkgBundleConfigs(process.cwd(), commandLineArgs)
}
