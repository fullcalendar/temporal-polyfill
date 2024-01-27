#!/usr/bin/env node
// Based on https://github.com/js-temporal/temporal-polyfill/blob/main/runtest262.mjs

import runTest262 from '@js-temporal/temporal-test262-runner'
import { join as joinPaths } from 'path'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

const scriptsDir = joinPaths(process.argv[1], '..')
const pkgDir = joinPaths(scriptsDir, '..')
const monorepoDir = joinPaths(pkgDir, '../..')

yargs(hideBin(process.argv))
  .command(
    '*',
    'Run test262 tests',
    (builder) => {
      builder.option('update', {
        requiresArg: false,
        default: false,
        type: 'boolean',
        description: 'Whether to update the existing expected-failure files on-disk and remove tests that now pass.'
      })
      builder.option('timeout', {
        requiresArg: false,
        default: 30000,
        type: 'number',
        description: 'Millisecond allowance for a single test file to run'
      })
      builder.option('max', {
        requiresArg: false,
        default: 10,
        type: 'number',
        description: 'Maxiumum allowed number of failures before aborting'
      })
      builder.option('min', { // for "minify"
        requiresArg: false,
        default: false,
        type: 'boolean',
        description: 'Whether to test the minified bundle'
      })
    },
    (parsedArgv) => {
      const expectedFailureFiles = [
        'expected-failures.txt',
        'expected-failures-surface.txt',
      ]

      const nodeVersion = process.versions.node
      const nodeMajorVersion = parseInt(nodeVersion.split('.')[0])
      if (nodeMajorVersion >= 18) {
        expectedFailureFiles.push('expected-failures-intl-format-norm.txt')
      }
      if (nodeMajorVersion < 18) {
        expectedFailureFiles.push('expected-failures-before-node18.txt')
      }
      if (nodeMajorVersion < 16) {
        expectedFailureFiles.push('expected-failures-before-node16.txt')
      }

      console.log(`Testing with Node v${nodeVersion}...`)

      const result = runTest262({
        test262Dir: joinPaths(monorepoDir, 'test262'),
        polyfillCodeFile: joinPaths(
          pkgDir,
          parsedArgv.min
            ? 'dist/global.min.js'
            : 'dist/global.js'
        ),
        expectedFailureFiles: expectedFailureFiles.map((filename) => (
          joinPaths(scriptsDir, 'test-config', filename)
        )),
        testGlobs: parsedArgv._,
        timeoutMsecs: parsedArgv.timeout || 86400000,
        updateExpectedFailureFiles: parsedArgv.update,
        maxFailures: parsedArgv.max,
        fullPath: true
      })

      process.exit(result ? 0 : 1)
    }
  )
  .help().argv
