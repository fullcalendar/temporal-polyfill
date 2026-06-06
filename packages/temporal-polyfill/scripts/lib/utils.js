import { spawn } from 'child_process'

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

// Gives all test runners one place to honor a requested test Node version. The
// caller reads its own configuration, while this helper only handles the PNPM
// use-node-version rerun mechanics.
export async function rerunUnderRequestedTestNode(
  requestedNodeVersion,
  nodeArgs,
) {
  if (requestedNodeVersion && requestedNodeVersion !== process.versions.node) {
    await execLive(['pnpm', 'exec', 'node', ...nodeArgs], {
      env: {
        ...filterNodePackageManagerEnv(process.env),

        // Forces PNPM to use a specific Node version (see .npmrc).
        PNPM_NODE_VERSION: requestedNodeVersion,
      },
    })
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

export function popFlag(argv, arg) {
  const i = argv.indexOf(arg)
  if (i !== -1) {
    argv.splice(i, 1)
    return true
  }
  return false
}
