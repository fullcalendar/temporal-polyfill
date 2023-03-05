import runTest262 from '@js-temporal/temporal-test262-runner'

const testGlobs = process.argv.slice(2)

const result = runTest262({
  test262Dir: 'test262',
  polyfillCodeFile: 'dist/global.js',
  expectedFailureFiles: ['expected-failures.txt'],
  testGlobs,
  timeoutMsecs: testGlobs.length
    ? 3600000 // (1 hour) running specific tests, don't timeout while debugging
    : 2000, // (2 seconds) running ALL tests, don't wait for infinite loops
})

// if result is `true`, all tests succeeded
process.exit(result ? 0 : 1)
