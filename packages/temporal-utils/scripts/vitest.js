#!/usr/bin/env node

import {
  execLive,
  rerunUnderRequestedTestNode,
} from '../../temporal-polyfill/scripts/lib/utils.js'

const vitestArgs = ['run', ...process.argv.slice(2)]

// Keep the outer package script on the repo's normal Node version while letting
// the actual test process observe the requested CI/runtime Node version.
if (!(await rerunUnderRequestedTestNode(process.argv.slice(1)))) {
  await execLive(['pnpm', 'exec', 'vitest', ...vitestArgs])
}
