#!/usr/bin/env node
/*
Based on https://github.com/js-temporal/temporal-polyfill/blob/main/runtest262.mjs
*/

import runTest262 from '@js-temporal/temporal-test262-runner';
import { join as joinPaths } from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const scriptsDir = joinPaths(process.argv[1], '..');
const pkgDir = joinPaths(scriptsDir, '..');
const monorepoDir = joinPaths(pkgDir, '../..');

yargs(hideBin(process.argv))
  .command(
    '*',
    'Run test262 tests',
    (builder) => {
      builder.option('update-expected-failure-files', {
        requiresArg: false,
        default: false,
        type: 'boolean',
        description: 'Whether to update the existing expected-failure files on-disk and remove tests that now pass.'
      });
      builder.option('timeout', {
        requiresArg: false,
        default: 30000,
        type: 'number',
        description: 'Milliseconds allowance for a single test file to run'
      })
    },
    (parsedArgv) => {
      const expectedFailureFiles = [
        'expected-failures.txt',
        'expected-failures-es5.txt'
      ];

      const nodeVersion = parseInt(process.versions.node.split('.')[0]);
      if (nodeVersion < 18) expectedFailureFiles.push('expected-failures-before-node18.txt');
      if (nodeVersion < 16) expectedFailureFiles.push('expected-failures-before-node16.txt');
      // Eventually this should be fixed and this condition should be updated.
      if (nodeVersion >= 18) expectedFailureFiles.push('expected-failures-cldr42.txt');

      // As we migrate commits from proposal-temporal, remove expected failures from here.
      expectedFailureFiles.push('expected-failures-todo-migrated-code.txt');

      const result = runTest262({
        test262Dir: joinPaths(monorepoDir, 'test262'),
        polyfillCodeFile: joinPaths(pkgDir, 'dist/global.js'),
        expectedFailureFiles: expectedFailureFiles.map((filename) => (
          joinPaths(scriptsDir, 'test-config', filename)
        )),
        testGlobs: parsedArgv._,
        timeoutMsecs: parsedArgv.timeout,
        updateExpectedFailureFiles: parsedArgv.updateExpectedFailureFiles
      });

      process.exit(result ? 0 : 1);
    }
  )
  .help().argv;
