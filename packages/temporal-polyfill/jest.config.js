import base from '../../jest.config.base.js'

export default {
  ...base,
  preset: 'ts-jest',
  setupFiles: ['jest-date-mock'],
  roots: ['<rootDir>/src'],
}
