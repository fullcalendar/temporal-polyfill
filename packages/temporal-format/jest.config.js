import base from '../../jest.config.base.js'

// If tests are failing unnecessarily, make sure that you have ran build on temporal-ponyfill

export default {
  ...base,
  preset: 'ts-jest/presets/js-with-babel-esm',
  roots: ['<rootDir>/src'],
}
