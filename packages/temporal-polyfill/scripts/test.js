#!/usr/bin/env node
// Based on https://github.com/js-temporal/temporal-polyfill/blob/main/runtest262.mjs

import runTest262 from '@js-temporal/temporal-test262-runner'
import { join as joinPaths } from 'path'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { rollup } from 'rollup'
import terser from '@rollup/plugin-terser'
import { extensions } from './config.js'

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
      }),
    async (options) => {
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

      let polyfillPath // from package root

      if (options.esm) {
        console.log('Bundling ESM...')
        polyfillPath = await bundleEsm('./dist', 'global', options.min)
      } else if (options.min) {
        polyfillPath = './dist/global' + extensions.iifeMin
      } else {
        polyfillPath = './dist/global' + extensions.iife
      }

      console.log(`Testing ${polyfillPath} with Node v${nodeVersion}...`)

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

async function bundleEsm(dir, exportName, minify) {
  const inputFilename = exportName + extensions.esm
  const outputFilename = '.bundled.' + (minify ? 'min.' : '') + inputFilename

  const bundle = await rollup({
    input: dir + '/' + inputFilename,
  })
  await bundle.write({
    file: dir + '/' + outputFilename,
    format: 'iife',
    plugins: [
      minify && terser()
    ]
  })

  return dir + '/' + outputFilename
}
