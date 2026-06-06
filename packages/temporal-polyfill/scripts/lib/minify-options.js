import { join as joinPaths } from 'path'
import { readFile } from 'fs/promises'

// If property mangling comes back, do not add `nameCache` here without
// re-testing the official Rollup Terser plugin. Older experiments with
// cross-chunk nameCache produced invalid ESM.

export function buildTerserReadableOptions() {
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
    mangle: false,
    format: {
      beautify: true,
      braces: true,
      indent_level: 2,
      preserve_annotations: true, // like PURE annotations
    },
  }
}

export function buildTerserMinifyOptions() {
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
    mangle: true,
  }
}

export function buildSwcMinifyOptions() {
  return {
    compress: {
      ecma: 2018,
      passes: 3, // enough to remove dead object assignment, get lower size

      // SWC erroneously removes =undefined params, so explicitly turn off,
      // and rely on expected-failures/minified-function-length.txt
      keep_fargs: false,

      unsafe_arrows: true,
      unsafe_methods: true,
      booleans_as_integers: true,
      hoist_funs: true,
    },
    mangle: true,
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
