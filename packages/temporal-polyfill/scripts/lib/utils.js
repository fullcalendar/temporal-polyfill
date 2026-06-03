import { spawn } from 'child_process'

export const TEST_NODE_VERSION_ENV = 'TEST_NODE_VERSION'
export const LEGACY_TEST_NODE_VERSION_ENV = 'TEST262_NODE_VERSION'

export function execLive(cmdParts, options = {}) {
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

// Gives all test runners one place to honor the requested test Node version.
// The outer process can stay on the repo's build-tool Node while the spawned
// process runs under PNPM's use-node-version override.
export async function rerunUnderRequestedTestNode(nodeArgs, options = {}) {
  const requestedNodeVersion = getRequestedTestNodeVersion()

  if (requestedNodeVersion && requestedNodeVersion !== process.versions.node) {
    await execLive(['pnpm', 'exec', 'node', ...nodeArgs], {
      ...options,
      env: {
        ...filterNodePackageManagerEnv(process.env),

        // Forces PNPM to use a specific Node version (see .npmrc).
        PNPM_NODE_VERSION: requestedNodeVersion,

        // Clear request envs for the spawned process to prevent recursion.
        [TEST_NODE_VERSION_ENV]: '',
        [LEGACY_TEST_NODE_VERSION_ENV]: '',
      },
    })
    return true
  }

  return false
}

// TEST262_NODE_VERSION is kept as a compatibility alias while test commands
// migrate to the generic TEST_NODE_VERSION name.
export function getRequestedTestNodeVersion() {
  return (
    process.env[TEST_NODE_VERSION_ENV] ||
    process.env[LEGACY_TEST_NODE_VERSION_ENV]
  )
}

export function popFlag(argv, arg) {
  const i = argv.indexOf(arg)
  if (i !== -1) {
    argv.splice(i, 1)
    return true
  }
  return false
}

// Filter away Node-related environment variables because they can prevent
// PNPM's use-node-version from taking effect in the child process.
function filterNodePackageManagerEnv(oldEnv) {
  const newEnv = {}

  for (const key in oldEnv) {
    if (!/node|npm|nvm/i.test(key)) {
      newEnv[key] = oldEnv[key]
    }
  }

  return newEnv
}
