import runTest262 from '@js-temporal/temporal-test262-runner'

const result = runTest262({
  test262Dir: 'test262',
  polyfillCodeFile: 'dist/global.js',
  expectedFailureFiles: ['expected-failures.txt'],
  testGlobs: process.argv.slice(2),

  // We'd like to set a high timeout when debugging, HOWEVER, some of the tests reveal infinite
  // loops in our code, so they're allowed to run for a whole minute.
  // TODO: fix infinite loops.
  //
  // timeoutMsecs: 60000,
})

// if result is `true`, all tests succeeded
process.exit(result ? 0 : 1)
