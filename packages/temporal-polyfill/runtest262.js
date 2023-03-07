import runTest262 from '@js-temporal/temporal-test262-runner'

const testGlobs = process.argv.slice(2)

const result = runTest262({
  test262Dir: 'test262',
  polyfillCodeFile: 'dist/global.js',
  expectedFailureFiles: [
    // from https://github.com/js-temporal/temporal-polyfill/blob/main/runtest262.mjs
    'misc/expected-failures.txt',
    'misc/expected-failures-es5.txt',
    // 'misc/expected-failures-opt.txt',
    'misc/expected-failures-before-node18.txt',
    // 'misc/expected-failures-before-node16.txt',
    'misc/expected-failures-todo-migrated-code.txt',
  ],
  testGlobs,
  // timeoutMsecs: 2000,
  timeoutMsecs: testGlobs.length
    ? 3600000 // (1 hour) running specific tests, don't timeout while debugging
    : 2000, // (2 seconds) running ALL tests, don't wait for infinite loops
})

// if result is `true`, all tests succeeded
process.exit(result ? 0 : 1)
