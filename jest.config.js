import base from './jest.config.base.js'

export default {
  ...base,
  projects: [
    '<rootDir>/packages/temporal-polyfill',
    '<rootDir>/packages/temporal-format',
    '<rootDir>/packages/locale-weekinfo',
    '<rootDir>/packages/locale-textinfo',
  ],
}
