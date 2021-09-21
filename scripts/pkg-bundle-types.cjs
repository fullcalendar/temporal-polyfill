const path = require('path')
const fs = require('fs')
const exec = require('./lib/exec.cjs').promise.withOptions({ live: true, exitOnError: true })

const rollupConfigPath = path.resolve(__dirname, '../rollup.config.cjs')

bundlePkgTypes()

async function bundlePkgTypes() {
  // HACK
  if (!fs.existsSync('./src/impl.ts')) {
    return Promise.resolve() // relative to cwd
  }

  // TODO: delete impl.d.ts.map (because rollup doesn't generate it!)

  await exec(['rollup', '--config', rollupConfigPath])

  // clear out extra definitions in ./dist
  // 1. remove tsbuild cached data because it will be invalidated
  await exec('rm ./tsconfig.tsbuildinfo')
  // 2. remove all directories
  await exec('find ./dist -mindepth 1 -type d -prune -exec rm -rf {} \\;')
  // 3. remove the 'performant' files (they became the 'index')
  await exec('find ./dist -mindepth 1 -type f -name \'performant.*\' -exec rm -rf {} \\;')
}
