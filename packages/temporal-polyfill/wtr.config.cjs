// Config for web-test-runner
// https://modern-web.dev/docs/test-runner/overview/

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
