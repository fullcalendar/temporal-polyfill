import runTest262 from '@js-temporal/temporal-test262-runner'

const result = runTest262({
  test262Dir: 'test262',
  polyfillCodeFile: 'dist/global.js',
  expectedFailureFiles: ['expected-failures.txt'],
  testGlobs: process.argv.slice(2),
})

// if result is `true`, all tests succeeded
process.exit(result ? 0 : 1)
