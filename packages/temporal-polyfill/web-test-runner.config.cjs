// NOTE: until Yarn PnP supports ESM imports (https://github.com/yarnpkg/berry/issues/638),
// this config file must be written in CJS and wtr's --config option must explicitly point
// to this file

const { esbuildPlugin } = require('@web/dev-server-esbuild')
const { defaultReporter } = require('@web/test-runner')

module.exports = {
  files: [
    './e2e/*.ts',
  ],
  nodeResolve: true,
  preserveSymlinks: true,
  esbuildTarget: 'auto',
  plugins: [
    esbuildPlugin({ ts: true, target: 'auto' }), // for TypeScript support
  ],
  testFramework: {
    config: {
      ui: 'bdd',
    },
  },
  reporters: [
    defaultReporter({ reportTestResults: true, reportTestProgress: true }),
  ],
}
