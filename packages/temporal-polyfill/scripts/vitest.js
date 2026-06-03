#!/usr/bin/env node

import { execLive, rerunUnderRequestedTestNode } from './lib/utils.js'

const vitestArgs = ['run', ...process.argv.slice(2)]

// Vitest should observe the same test Node version as test262, while leaving
// build-time tooling on the outer process's normal Node version.
if (
  !(await rerunUnderRequestedTestNode([
    'node_modules/vitest/vitest.mjs',
    ...vitestArgs,
  ]))
) {
  console.log(`Testing Vitest with Node ${process.versions.node} ...`)
  await execLive(['pnpm', 'exec', 'vitest', ...vitestArgs])
}
