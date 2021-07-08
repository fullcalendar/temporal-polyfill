import base from '../../jest.config.base.js'

export default {
  ...base,
  preset: 'ts-jest/presets/js-with-babel-esm',
  roots: ['<rootDir>/src'],
}
