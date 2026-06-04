import { join as joinPaths } from 'path'
import { readFile } from 'fs/promises'

const terserNameCache = {}
const startsWithLetterRegExp = /^[a-zA-Z]/

export function buildTerserOptions({
  humanReadable = false,
  mangleProps = false,
  preserveAnnotations = false,
  manglePropsExcept,
}) {
  return {
    compress: {
      ecma: 2018,
      passes: 3, // enough to remove dead object assignment, get lower size
      keep_fargs: true, // keep explicit =undefined params that define method .length
      unsafe_arrows: true,
      unsafe_methods: true,
      booleans_as_integers: true,
      hoist_funs: true,
    },
    mangle: mangleProps && {
      properties: {
        reserved: manglePropsExcept,
        keep_quoted: true,
      },
      // Unfortunately can't just mangle props and nothing else, so retain:
      keep_fnames: humanReadable,
      keep_classnames: humanReadable,
    },
    nameCache: terserNameCache, // for consistent mangling across chunks/files
    format: {
      beautify: humanReadable,
      braces: humanReadable,
      indent_level: 2,
      preserve_annotations: preserveAnnotations, // like PURE annotations
    },
  }
}

export async function readTemporalReservedWords(pkgDir) {
  const code = await readFile(
    joinPaths(pkgDir, '../temporal-spec/global.d.ts'),
    'utf-8',
  )
  return code
    .split(/\W+/)
    .filter((symbol) => symbol && startsWithLetterRegExp.test(symbol))
    .concat([
      // exposed in func API
      'branding',

      // JS props Rollup doesn't know about
      'resolvedOptions',
      'useGrouping',
      'relatedYear',

      // Public Intl.DateTimeFormat option keys must survive property mangling.
      // The Temporal formatters copy, transform, and fabricate option bags
      // before handing them back to native Intl, so mangling these keys changes
      // observable locale-formatting behavior.
      'calendar',
      'dateStyle',
      'day',
      'dayPeriod',
      'era',
      'fractionalSecondDigits',
      'full',
      'hour',
      'hour12',
      'hourCycle',
      'localeMatcher',
      'long',
      'medium',
      'minute',
      'month',
      'numberingSystem',
      'second',
      'short',
      'timeStyle',
      'timeZone',
      'timeZoneName',
      'weekday',
      'year',
    ])
}
