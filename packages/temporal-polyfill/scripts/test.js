#!/usr/bin/env node

import runTest262 from '@js-temporal/temporal-test262-runner'

const testGlobs = process.argv.slice(2)
const noTimeoutIndex = testGlobs.indexOf('--no-timeout')
const noTimeout = noTimeoutIndex !== -1
if (noTimeout) {
  testGlobs.splice(noTimeoutIndex, 1)
}

const result = runTest262({
  test262Dir: 'test262',
  polyfillCodeFile: 'dist/global.js',
  expectedFailureFiles: [
    // from https://github.com/js-temporal/temporal-polyfill/blob/main/runtest262.mjs
    'misc/expected-failures.txt',
    // 'misc/expected-failures-es5.txt',
    'misc/expected-failures-opt.txt',
    'misc/expected-failures-before-node18.txt',
    // 'misc/expected-failures-before-node16.txt',
    // 'misc/expected-failures-todo-migrated-code.txt',
  ],
  testGlobs,
  timeoutMsecs: (noTimeout ? (24 * 60 * 60) : 2) * 1000,
})

// if result is `true`, all tests succeeded
process.exit(result ? 0 : 1)
