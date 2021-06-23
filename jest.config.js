import base from './jest.config.base.js'

export default {
  ...base,
  projects: [
    '<rootDir>/packages/temporal-ponyfill',
    '<rootDir>/packages/temporal-format',
    '<rootDir>/packages/locale-weekinfo',
  ],
}
