#!/usr/bin/env node
// Based on https://github.com/js-temporal/temporal-polyfill/blob/main/runtest262.mjs

import runTest262 from '@js-temporal/temporal-test262-runner'
import { join as joinPaths } from 'path'
import { spawn } from 'child_process'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { ciRunning, ciConfig, extensions, currentNodeVersion, currentNodeMajorVersion } from './config.js'

const scriptsDir = joinPaths(process.argv[1], '..')
const pkgDir = joinPaths(scriptsDir, '..')
const monorepoDir = joinPaths(pkgDir, '../..')

yargs(hideBin(process.argv))
  .command(
    '*',
    'Run test262 tests',
    (builder) => builder
      .option('update', {
        requiresArg: false,
        default: false,
        type: 'boolean',
        description: 'Whether to update the existing expected-failure files on-disk and remove tests that now pass.'
      })
      .option('timeout', {
        requiresArg: false,
        default: 30000,
        type: 'number',
        description: 'Millisecond allowance for a single test file to run'
      })
      .option('max', {
        requiresArg: false,
        default: 10,
        type: 'number',
        description: 'Maxiumum allowed number of failures before aborting'
      })
      .option('esm', {
        requiresArg: false,
        default: false,
        type: 'boolean',
        description: 'Whether to test the ESM module'
      })
      .option('min', { // for "minify"
        requiresArg: false,
        default: false,
        type: 'boolean',
        description: 'Whether to test the minified bundle'
      })
      .option('node-version', {
        requiresArg: true,
        type: 'string',
      }),
    async (options) => {
      if (
        options.nodeVersion &&
        options.nodeVersion !== currentNodeVersion &&
        !process.env.NODE_VERSION // not already executing a forced-version call
      ) {
        return await liveExec([
          'pnpm', 'exec', 'node', ...process.argv.slice(1),
        ], {
          cwd: process.cwd(),
          env: {
            // will force PNPM to use a specific version (see .npmrc)
            NODE_VERSION: options.nodeVersion,
            PATH: process.env.PATH,
          }
        })
      }

      const expectedFailureFiles = [
        'expected-failures.txt',
        'expected-failures-surface.txt',
      ]

      if (currentNodeMajorVersion >= 18) {
        expectedFailureFiles.push('expected-failures-intl-format-norm.txt')
      }
      if (currentNodeMajorVersion < 18) {
        expectedFailureFiles.push('expected-failures-before-node18.txt')
      }
      if (currentNodeMajorVersion < 16) {
        expectedFailureFiles.push('expected-failures-before-node16.txt')
      }

      let { esm, min } = options

      if (ciRunning || process.env.NODE_VERSION) {
        esm = esm || ciConfig.esm
        min = min || ciConfig.min
      }

      let polyfillPath = // from package root
        (esm
          ? './dist/.bundled/global'
          : './dist/global') +
        (min
          ? extensions.iifeMin
          : extensions.iife)

      console.log(`Testing ${polyfillPath} with Node v${currentNodeVersion}...`)

      const result = runTest262({
        test262Dir: joinPaths(monorepoDir, 'test262'),
        polyfillCodeFile: joinPaths(pkgDir, polyfillPath),
        expectedFailureFiles: expectedFailureFiles.map((filename) => (
          joinPaths(scriptsDir, 'test-config', filename)
        )),
        testGlobs: options._,
        timeoutMsecs: options.timeout || 86400000,
        updateExpectedFailureFiles: options.update,
        maxFailures: options.max,
        fullPath: true
      })

      process.exit(result ? 0 : 1)
    }
  )
  .showHelpOnFail(false)
  .help().argv

// Utils
// -------------------------------------------------------------------------------------------------

function liveExec(cmdParts, options = {}) {
  return new Promise((resolve, reject) => {
    spawn(cmdParts[0], cmdParts.slice(1), {
      shell: false,
      stdio: 'inherit',
      ...options,
    }).on('close', (status) => {
      if (status === 0) {
        resolve()
      } else {
        reject(new Error(`Command failed with status code ${status}`))
      }
    })
  })
}
