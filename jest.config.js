import { pathsToModuleNameMapper } from 'ts-jest/utils/index.js'
import { compilerOptions } from './tsconfig.json'

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
  globals: {
    'ts-jest': {},
  },
}
