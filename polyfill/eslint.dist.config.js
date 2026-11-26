/*
ESLint config for the build output only. Biome lints the source; this exists to
hold the published files in dist/ to the browser minimums listed in
README.md#supported-environments:

  Chrome 80, Firefox 74, Safari 14, Edge 80

Run it with `pnpm run check:syntax`, which `pnpm run build` also runs.
If the README table changes, update the rules below to match.
*/

import esX from 'eslint-plugin-es-x'
import { minifyPathMap } from './scripts/lib/config.js'

// Every browser in the table supports ES2020, including the `?.`, `??`, and
// BigInt literals the build ships, so anything from ES2021 or later is an
// error.
const restrictToEs2020 = esX.configs['flat/restrict-to-es2020']

export default [
  {
    // npm skips hidden files when publishing (see dist/.npmignore), so
    // dist/.tsc/ and the dist/.global.min.js size-check builds aren't shipped.
    ignores: ['dist/**/.*', 'dist/**/.*/**'],
  },
  {
    ...restrictToEs2020,
    files: ['dist/**/*.js'],
    languageOptions: {
      // Parse anything, so es-x reports newer syntax by name instead of the
      // parser failing on it.
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      ...restrictToEs2020.rules,

      // ES2020 or earlier, so the preset allows them, but they're newer than
      // some of the browsers in the table. A regex literal with an unsupported
      // feature stops the whole file from parsing.
      'es-x/no-regexp-lookbehind-assertions': 'error', // Firefox 78, Safari 16.4
      'es-x/no-regexp-named-capture-groups': 'error', // Firefox 78
      'es-x/no-regexp-s-flag': 'error', // Firefox 78
      'es-x/no-regexp-unicode-property-escapes': 'error', // Firefox 78
      'es-x/no-export-ns-from': 'error', // Firefox 80, Safari 14.1
    },
  },
  {
    // The IIFE bundles (the CDN builds) load as classic <script> tags. The
    // minifier config already lists exactly these files.
    files: Object.keys(minifyPathMap),
    languageOptions: { sourceType: 'script' },
  },
]
