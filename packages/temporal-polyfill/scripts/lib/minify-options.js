import { join as joinPaths } from 'path'
import { readFile } from 'fs/promises'

// If property mangling comes back, do not add `nameCache` here without
// re-testing the official Rollup Terser plugin. Older experiments with
// cross-chunk nameCache produced invalid ESM.

/*
Optimizations that are done on the per-ESM-module level
See below function's explanation about mangling. Applies here too
TODO: reorganize these comments and more explicitly explain minification flow
NEW: CRAZINESS with inlining consts, because reduce_vars:true AND evaluate:true
Happens because string consts within-files are inline a lot I think
But outputted files look fine. Only strings seem inlined, tho not long error strings
*/
export function buildTerserEsmOptions() {
  return {
    compress: {
      // aggressive settings
      passes: 2, // esp needed for multiple tiers of function inlining
      ecma: 2020,
      builtins_ecma: 2020,
      builtins_pure: true,
      unsafe_arrows: true, // just converts anon function(){} to ()=>
      unsafe_methods: true, // just converts { m: function(){} } to { m(){} }
      // Risky, but we have good test coverage. Not returning literal true/false publicly anyway
      booleans_as_integers: true,
      // We do NOT do hoist_funs. Best to save that when everything is in one big iife

      // // stops the CRAZINESS
      // reduce_vars: false,

      // for readability
      join_vars: false,
      keep_fnames: true,
      keep_classnames: true,
    },
    mangle: false,
    format: {
      beautify: true,
      braces: true,
      indent_level: 2,

      // Preserve PURE annotations we injected via pure-top-level plugin,
      // for better tree-shaking
      preserve_annotations: true,
    },
  }
}

/*
Apply optimizations that would NOT normally happen with a default terser config,
while still keeping outputted file readable. We need to mangle const names
because otherwise they are overly-aggresively inlined due to their name length
being not much longer than their impl length. We must do mangle:true, but undo
function/class mangling.

Also, hoist_funs only works well when const names mangled during this pass
because after being hosted, if a function references a const which is defined
after, Terser will not inline it.

Sanity checks for output:
- "Mismatching types for formatting" x3 -- probably should NOT be inlined
- "Invalid formatting options" x1 -- should ALWAYS be inlined
- Single-use functions that should ALWAYS be inlined:
  - totalDuration
  - roundPlainTime
*/
export function buildTerserReadableIifeOptions() {
  return {
    // keep function/class names for readability
    // applies to both compress and mangle
    keep_fnames: true,
    keep_classnames: true,

    compress: {
      // aggressive settings
      passes: 2, // esp needed for multiple tiers of function inlining
      ecma: 2020,
      builtins_ecma: 2020,
      builtins_pure: true,
      unsafe_arrows: true, // just converts anon function(){} to ()=>
      unsafe_methods: true, // just converts { m: function(){} } to { m(){} }
      hoist_funs: true, // the main reason we're doing this

      // for readability
      join_vars: false,
    },
    mangle: true, // except function/class
    format: {
      beautify: true,
      braces: true,
      indent_level: 2,

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
