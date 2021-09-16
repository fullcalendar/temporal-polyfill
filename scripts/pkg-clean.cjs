const exec = require('./lib/exec.cjs').sync.withOptions({ live: true, exitOnError: true })

exec(['tsc', '--build', '--clean'])
exec(['rm', '-rf', 'dist'])
