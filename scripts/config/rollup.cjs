const dts = require('rollup-plugin-dts').default
const { getPkgConfig, analyzePkgConfig } = require('../lib/pkg-analyze.cjs')

const pkgConfig = getPkgConfig(process.cwd())
const { exportSubnames } = analyzePkgConfig(pkgConfig)

const dtsPath = exportSubnames.includes('impl')
  ? './dist/impl.d.ts'
  : './dist/index.d.ts'

module.exports = {
  input: dtsPath,
  output: {
    file: dtsPath, // write in-place
    format: 'es',
    // sourcemap: true, // doesn't support sourcemaps
  },
  plugins: [dts()],
}
