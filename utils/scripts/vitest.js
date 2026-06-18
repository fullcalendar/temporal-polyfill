#!/usr/bin/env node

import {
  execLive,
  rerunUnderRequestedTestNode,
} from '../../polyfill/scripts/lib/utils.js'

if (
  !(await rerunUnderRequestedTestNode(
    process.env.VITEST_NODE_VERSION,
    process.argv.slice(1),
  ))
) {
  await execLive(['pnpm', 'exec', 'vitest', 'run', ...process.argv.slice(2)])
}
