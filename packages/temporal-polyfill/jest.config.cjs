const base = require('../../jest.config.base.cjs')

module.exports = {
  ...base,
  setupFilesAfterEnv: [
    '<rootDir>/jest-setup.js',
  ],
  moduleNameMapper: {
    // TODO: supply the built file when in CI mode
    'temporal-polyfill/impl': '<rootDir>/src/impl.ts',
  },
  testMatch: [
    '<rootDir>/tests/**/*.js',
  ],
}
