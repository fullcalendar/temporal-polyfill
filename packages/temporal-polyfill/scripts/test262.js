#!/usr/bin/env node
// Based on https://github.com/js-temporal/temporal-polyfill/blob/main/runtest262.mjs

import { join as joinPaths } from 'path'
import runTest262 from '@js-temporal/temporal-test262-runner'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { rerunUnderRequestedTestNode } from './lib/utils.js'

const scriptsDir = joinPaths(process.argv[1], '..')
const pkgDir = joinPaths(scriptsDir, '..')
const monorepoDir = joinPaths(pkgDir, '../..')

yargs(hideBin(process.argv))
  .command(
    '*',
    'Run test262 tests',
    (builder) =>
      builder
        .option('update', {
          requiresArg: false,
          default: false,
          type: 'boolean',
          description:
            'Whether to update the existing expected-failure files on-disk and remove tests that now pass.',
        })
        .option('timeout', {
          requiresArg: false,
          default: 30000,
          type: 'number',
          description: 'Millisecond allowance for a single test file to run',
        })
        .option('max', {
          requiresArg: false,
          default: 10,
          type: 'number',
          description: 'Maximum allowed number of failures before aborting',
        }),
    async (options) => {
      // Only the test runner needs the requested Node version. Build tools can
      // stay on the repo's normal Node and delegate here through PNPM.
      if (await rerunUnderRequestedTestNode(process.argv.slice(1))) {
        return
      }

      const currentNodeVersion = process.versions.node
      const currentNodeMajorVersion = parseInt(currentNodeVersion.split('.')[0])
      const isNative = currentNodeMajorVersion >= 26

      const expectedFailureFiles = isNative
        ? ['native.txt']
        : ['shim.txt', 'shim-builtin-calls.txt', 'shim-descriptor.txt']

      if (!isNative) {
        if (currentNodeMajorVersion <= 16) {
          expectedFailureFiles.push('shim-node-lte16.txt')
        }
        if (currentNodeMajorVersion <= 18) {
          expectedFailureFiles.push('shim-node-lte18.txt')
        }
        if (currentNodeMajorVersion <= 20) {
          expectedFailureFiles.push('shim-node-lte20.txt')
        }
        if (currentNodeMajorVersion <= 22) {
          expectedFailureFiles.push('shim-node-lte22.txt')
        }
        if (currentNodeMajorVersion >= 16) {
          expectedFailureFiles.push('shim-node-gte16.txt')
        }
        if (currentNodeMajorVersion >= 18) {
          expectedFailureFiles.push('shim-node-gte18.txt')
        }
        if (currentNodeMajorVersion >= 18 && currentNodeMajorVersion <= 24) {
          expectedFailureFiles.push('shim-node-gte18-lte24.txt')
        }
        if (currentNodeMajorVersion >= 22) {
          expectedFailureFiles.push('shim-node-gte22.txt')
        }
        if (currentNodeMajorVersion >= 24) {
          expectedFailureFiles.push('shim-node-gte24.txt')
        }
      }

      const globalPolyfillPath = './dist/full/global.js'

      console.log(
        `Testing ${globalPolyfillPath} with Node ${currentNodeVersion} ...`,
      )

      const result = runTest262({
        test262Dir: joinPaths(monorepoDir, 'test262'),
        polyfillCodeFile: joinPaths(pkgDir, globalPolyfillPath),
        expectedFailureFiles: expectedFailureFiles.map((filename) =>
          joinPaths(scriptsDir, 'test262-expected-failures', filename),
        ),
        testGlobs: options._,
        timeoutMsecs: options.timeout || 86400000,
        updateExpectedFailureFiles: options.update,
        maxFailures: options.max,
        fullPath: true,
      })

      process.exit(result ? 0 : 1)
    },
  )
  .showHelpOnFail(false)
  .parse()
