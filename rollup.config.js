import dts from 'rollup-plugin-dts'

// Please note that this should not and will not run globally
// Only execute this inside of a specific workspace in order to generate a bundled declaration file

export const rollupConfig = {
  input: 'dist/impl.d.ts',
  output: {
    file: 'dist/impl.d.ts',
    format: 'es',
    // sourcemap: true, // doesn't support sourcemaps
  },
  plugins: [dts()],
}

export default rollupConfig
