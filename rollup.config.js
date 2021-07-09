import dts from 'rollup-plugin-dts'

// Please note that this should not and will not run globally
// Only execute this inside of a specific workspace in order to generate a bundled declaration file

export const rollupConfig = {
  input: 'dist/index.d.ts',
  output: { file: 'dist/index.d.ts', format: 'es' },
  plugins: [dts()],
}

export default rollupConfig
