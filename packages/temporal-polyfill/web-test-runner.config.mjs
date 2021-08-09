import { defaultReporter } from '@web/test-runner'

export default {
  files: [ // './e2e/*.mjs'
    // './e2e/calendar.mjs',
    // './e2e/datemath.mjs',
    // './e2e/duration.mjs',
    // './e2e/ecmascript.mjs',
    // './e2e/exports.mjs',
    // './e2e/instant.mjs',
    // './e2e/intl.mjs',
    // './e2e/now.mjs',
    // './e2e/plaindate.mjs',
    './e2e/plaindatetime.mjs',
    // './e2e/plainmonthday.mjs',
    // './e2e/plaintime.mjs',
    // './e2e/plainyearmonth.mjs',
    // './e2e/regex.mjs',
    // './e2e/timezone.mjs',
    // './e2e/usercalendar.mjs',
    // './e2e/usertimezone.mjs',
    // './e2e/zoneddatetime.mjs',
  ],
  nodeResolve: true,
  preserveSymlinks: true,
  esbuildTarget: 'auto',
  plugins: [],
  testFramework: {
    config: {
      ui: 'bdd',
    },
  },
  reporters: [
    defaultReporter({ reportTestResults: true, reportTestProgress: true }),
  ],

  watch: false,
  // If you need to manually test
  // manual: true,
  // open: true,

  // Due to being a monorepo
  rootDir: '../../',
}
