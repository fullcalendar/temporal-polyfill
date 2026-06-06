#!/usr/bin/env node

import { execLive, rerunUnderRequestedTestNode } from './lib/utils.js'

if (
  !(await rerunUnderRequestedTestNode(
    process.env.TEST_NODE_VERSION,
    process.argv.slice(1),
  ))
) {
  await execLive(['pnpm', 'exec', 'vitest', 'run', ...process.argv.slice(2)])
}
