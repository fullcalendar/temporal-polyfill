#!/usr/bin/env node
// Based on https://github.com/js-temporal/temporal-polyfill/blob/main/runtest262.mjs

import { join as joinPaths } from 'path'
import runTest262 from '@js-temporal/temporal-test262-runner'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { extensions } from './lib/config.js'
import { execLive } from './lib/utils.js'

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
        })
        .option('esm', {
          requiresArg: false,
          default: false,
          type: 'boolean',
          description: 'Whether to test the ESM module',
        })
        .option('min', {
          // for "minify"
          requiresArg: false,
          default: false,
          type: 'boolean',
          description: 'Whether to test the minified bundle',
        }),
    async (options) => {
      const currentNodeVersion = process.versions.node
      const currentNodeMajorVersion = parseInt(currentNodeVersion.split('.')[0])
      const requestedNodeVersion = process.env.TEST262_NODE_VERSION

      // If different version of Node requested, spawn a new process
      if (requestedNodeVersion && requestedNodeVersion !== currentNodeVersion) {
        return await execLive(
          ['pnpm', 'exec', 'node', ...process.argv.slice(1)],
          {
            cwd: process.cwd(),
            env: {
              ...filterEnv(process.env),

              // Forces PNPM to use specific version (see .npmrc)
              PNPM_NODE_VERSION: requestedNodeVersion,

              // Clear requestedNodeVersion for spawned process
              TEST262_NODE_VERSION: '',
            },
          },
        )
      }

      const expectedFailureFiles = [
        'expected-failures.txt',
        'expected-failures-builtin-calls.txt',
        'expected-failures-descriptor.txt',
      ]

      if (currentNodeMajorVersion <= 14) {
        expectedFailureFiles.push('expected-failures-node-lte14.txt')
      }
      if (currentNodeMajorVersion <= 16) {
        expectedFailureFiles.push('expected-failures-node-lte16.txt')
      }
      if (currentNodeMajorVersion <= 18) {
        expectedFailureFiles.push('expected-failures-node-lte18.txt')
      }
      if (currentNodeMajorVersion <= 20) {
        expectedFailureFiles.push('expected-failures-node-lte20.txt')
      }
      if (currentNodeMajorVersion >= 16) {
        expectedFailureFiles.push('expected-failures-node-gte16.txt')
      }
      if (currentNodeMajorVersion >= 18) {
        expectedFailureFiles.push('expected-failures-node-gte18.txt')
      }
      if (currentNodeMajorVersion >= 22) {
        expectedFailureFiles.push('expected-failures-node-gte22.txt')
      }

      const esmOpt = process.env.TEST262_ESM
      const esmOptIsMin = esmOpt === 'terser' || esmOpt === 'swc'
      const globalIsMin = options.min || process.env.TEST262_MIN

      // from package root
      const polyfillPath = esmOpt
        ? './dist/.bundled/global' +
          (esmOptIsMin ? '.' + esmOpt + extensions.iifeMin : extensions.iife)
        : './dist/global' + (globalIsMin ? extensions.iifeMin : extensions.iife)

      console.log(`Testing ${polyfillPath} with Node ${currentNodeVersion} ...`)

      const result = runTest262({
        test262Dir: joinPaths(monorepoDir, 'test262'),
        polyfillCodeFile: joinPaths(pkgDir, polyfillPath),
        expectedFailureFiles: expectedFailureFiles.map((filename) =>
          joinPaths(scriptsDir, 'test262-config', filename),
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

// Filter away Node-related environment variables because prevents
// PNPM's use-node-version from being reset
function filterEnv(oldEnv) {
  const newEnv = {}

  for (const key in oldEnv) {
    if (!/node|npm|nvm/i.test(key)) {
      newEnv[key] = oldEnv[key]
    }
  }

  return newEnv
}
