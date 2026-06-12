import { join as joinPaths } from 'path'
import { readFile } from 'fs/promises'

// If property mangling comes back, do not add `nameCache` here without
// re-testing the official Rollup Terser plugin. Older experiments with
// cross-chunk nameCache produced invalid ESM.

export function buildTerserEsmOptions() {
  // Essentially just remove comments and reformat whitespace
  return {
    compress: false,
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
  "Mismatching types for formatting" x3
  "Invalid formatting options" x1 -- should ALWAYS be inlined

  NOTE: we're temporarily using global.js to test minification size
  Just easier to think about the minification in a single pass
  See minifyPathMap TEMPORARY
  In package.json, we TEMPORARILY removed `pnpm run minify && ` from "size" script
*/
export function buildTerserReadableIifeOptions() {
  return {
    compress: {
      // HACK
      // Disabling defaults:true, and thus enabling evaluate:true,
      // will inline LOTS of string consts (and maybe other consts)
      // which gzip seems to LOVE (20442). More passes helps too.
      // However, the side effect is that some things get inlined that shouldn't
      // Like  "Mismatching types for formatting" x3,
      // which when used as a const, saves 6 bytes
      // BUT, even after we undo this hack,
      // our hoist_funs:true prevents the "Invalid formatting options" inlining,
      // because the const appears after the use in the function :(
      //
      passes: 3,
      //
      // // Since REAL minification will run again for .min.js,
      // // disable destructive defaults like evaluate:true
      // defaults: false,

      // Enable options that will NOT run again when .min.js is generated,
      // so all options that are NOT the Terser default
      ecma: 2020,
      builtins_ecma: 2020,
      builtins_pure: true,
      hoist_funs: true, // the main reason we're doing this
      unsafe_arrows: true, // just converts anon function(){} to ()=>
      unsafe_methods: true, // just converts { m: function(){} } to { m(){} }
    },
    mangle: true,
    // format: {
    //   beautify: true,
    //   braces: true,
    //   indent_level: 2,
    // },
  }
}

/*
  TEMPORARY: minifies the already-minified output from above
*/
export function buildTerserMinifyOptions() {
  return {
    // Simular what jsdelivr does by simply using Terser defaults,
    // which implies mangle: true. Ticket with more info:
    // https://github.com/jsdelivr/jsdelivr/issues/18185
    // // DEBUGGING:
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
