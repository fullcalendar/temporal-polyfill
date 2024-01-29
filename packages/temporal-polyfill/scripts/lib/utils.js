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

export function popFlag(argv, arg) {
  const i = argv.indexOf(arg)
  if (i !== -1) {
    argv.splice(i, 1)
    return true
  }
  return false
}
