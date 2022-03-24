const base = require('../../jest.config.base.cjs')

module.exports = {
  ...base,
  roots: [
    '<rootDir>/src',
  ],
  testMatch: [
    '<rootDir>/src/specs/*.spec.ts',
  ],
}
