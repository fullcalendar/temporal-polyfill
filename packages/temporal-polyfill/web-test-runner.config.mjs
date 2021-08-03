import commonjs from '@rollup/plugin-commonjs'

export default {
  files: './e2e/*.mjs',
  nodeResolve: true,
  preserveSymlinks: true,
  esbuildTarger: 'auto',
  plugins: [commonjs()],

  watch: true,
  // If you need to manually test
  // manual: true,
  // open: true,

  // Due to being a monorepo
  rootDir: '../../',
}
