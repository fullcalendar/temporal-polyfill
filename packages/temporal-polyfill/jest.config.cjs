const base = require('../../jest.config.base.cjs')

module.exports = {
  ...base,
  roots: [
    '<rootDir>/src',
    '<rootDir>/e2e',
  ],
}
