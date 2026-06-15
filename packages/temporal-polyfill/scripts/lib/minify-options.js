import { join as joinPaths } from 'path'
import { readFile } from 'fs/promises'

// If property mangling comes back, do not add `nameCache` here without
// re-testing the official Rollup Terser plugin. Older experiments with
// cross-chunk nameCache produced invalid ESM.

/*
Sanity checks for output:
- "Mismatching types for formatting" x3 -- probably should NOT be inlined
- "Invalid formatting options" x1 -- should ALWAYS be inlined
- Single-use functions that should ALWAYS be inlined:
  - totalDuration
  - roundPlainTime
*/

const baseNonMangleCompressOptions = {
  passes: 2, // sweet spot. needed for multiple tiers of function inlining
  ecma: 2020,
  builtins_ecma: 2020,
  builtins_pure: true,
  unsafe_arrows: true, // just converts anon function(){} to ()=>
  unsafe_methods: true, // just converts { m: function(){} } to { m(){} }
  join_vars: false, // for readability

  // Adjust inlining
  // See our terser package's fork-info/api-docs.md
  assume_mangled: true, // corrects inlining calculations when mangle:false
  string_inline_aggressiveness: 4, // sweet spot
  // string_inline_lte_length: 22 // will inline "fractionalSecondDigits"
}

const baseFormatOptions = {
  beautify: true,
  braces: true,
  indent_level: 2,
}

export function buildTerserEsmOptions() {
  return {
    compress: {
      ...baseNonMangleCompressOptions,

      // Risky, but we have good test coverage
      // We're not returning literal true/false publicly anyway
      // Only necessary in this first pass, not in iife
      booleans_as_integers: true,
    },
    mangle: false,
    format: {
      ...baseFormatOptions,

      // preserve quoted props so prop-mangler plugin knows to not mangle
      // when its own `keepQuoted` setting is enabled
      keep_quoted_props: true,

      // Preserve PURE annotations we injected via pure-top-level plugin,
      // for better tree-shaking
      preserve_annotations: true,
    },
  }
}

export function buildTerserReadableIifeOptions() {
  return {
    compress: {
      ...baseNonMangleCompressOptions,

      // Only makes sense now that all esm assembled into one big iife
      hoist_funs: true,
    },
    mangle: false,
    format: {
      ...baseFormatOptions,

      // FYI, we do NOT preserve_annotations. Results in larger size for later
      // final minified version, which only does one Terser pass, probably
      // because it prevents further inlining. Anyway, it's a setting meant for
      // tree-shaking, which is already complete by the time this readable iife
      // file is generated.
    },
  }
}

/*
Simulate what jsdelivr does by simply using Terser defaults,
which implies mangle: true. Ticket with more info:
https://github.com/jsdelivr/jsdelivr/issues/18185
*/
export function buildTerserMinifyOptions() {
  return {
    // // DEBUGGING:
    // keep_fnames: true,
    // keep_classnames: true,
    // format: {
    //   beautify: true,
    //   braces: true,
    //   indent_level: 2,
    // },
  }
}

export function buildSwcMinifyOptions() {
  return {
    compress: {
      // SWC erroneously removes =undefined params, so explicitly turn off,
      // and rely on expected-failures/minified-function-length.txt
      keep_fargs: false,
    },
    mangle: true, // don't assume default
  }
}

const startsWithLetterRegExp = /^[a-zA-Z]/

export async function readTemporalReservedWords(pkgDir) {
  const code = await readFile(
    joinPaths(pkgDir, '../temporal-spec/global.d.ts'),
    'utf-8',
  )
  return code
    .split(/\W+/)
    .filter((symbol) => symbol && startsWithLetterRegExp.test(symbol))
}
