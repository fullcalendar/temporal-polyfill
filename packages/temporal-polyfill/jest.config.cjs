const base = require('../../jest.config.base.cjs')

module.exports = {
  ...base,
  setupFilesAfterEnv: [
    '<rootDir>/jest-setup.js',
  ],
  moduleNameMapper: {
    // TODO: supply the built file when in CI mode
    // TODO: way to test built files?
    'temporal-polyfill/impl': '<rootDir>/src/impl.build.ts',
  },
  testMatch: [
    '<rootDir>/tests/**/*.js',
  ],
}
