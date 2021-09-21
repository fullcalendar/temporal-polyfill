const dts = require('rollup-plugin-dts').default

// Please note that this should not and will not run globally
// Only execute this inside of a specific workspace in order to generate a bundled declaration file

module.exports = {
  input: 'dist/impl.d.ts',
  output: {
    file: 'dist/impl.d.ts',
    format: 'es',
    // sourcemap: true, // doesn't support sourcemaps
  },
  plugins: [dts()],
}
