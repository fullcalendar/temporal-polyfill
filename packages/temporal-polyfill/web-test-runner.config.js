import { esbuildPlugin } from '@web/dev-server-esbuild'
import { defaultReporter } from '@web/test-runner'

export default {
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
