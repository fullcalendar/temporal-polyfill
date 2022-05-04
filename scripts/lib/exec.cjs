const { promisify } = require('util')
const exec = promisify(require('child_process').exec)

module.exports = {
  exec, // from https://medium.com/stackfame/how-to-run-shell-script-file-or-command-using-nodejs-b9f2455cb6b7
}
