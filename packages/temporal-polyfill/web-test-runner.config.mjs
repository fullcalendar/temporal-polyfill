import { defaultReporter } from '@web/test-runner'

export default {
  files: './e2e/*.mjs',
  nodeResolve: true,
  preserveSymlinks: true,
  esbuildTarget: 'auto',
  plugins: [],
  testFramework: {
    config: {
      ui: 'bdd',
    },
  },
  reporters: [
    defaultReporter({ reportTestResults: true, reportTestProgress: true }),
  ],

  watch: false,
  // If you need to manually test
  // manual: true,
  // open: true,

  // Due to being a monorepo
  rootDir: '../../',
}
