const base = require('./jest.config.base.cjs')

module.exports = {
  ...base,
  projects: [
    '<rootDir>/packages/temporal-polyfill',
    // '<rootDir>/packages/locale-weekinfo',
    // '<rootDir>/packages/locale-textinfo',
    // '<rootDir>/packages/datetimeformat-tokens',
    // '<rootDir>/packages/durationformat-polyfill',
  ],
}
