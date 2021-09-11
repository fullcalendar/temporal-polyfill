const standardConfig = require('eslint-config-standard/eslintrc.json')

// Based on "Standard" (https://standardjs.com/), but with TypeScript support
// Why not use the "standard-with-typescript" project? See note about parserServices below
// Deps must be installed manually: https://github.com/standard/eslint-config-standard#install
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'standard',
  ],
  rules: {
    ...buildTsRules(),

    // Max line length, with some exceptions
    'max-len': ['error', { code: 100, ignoreRegExpLiterals: true, ignoreUrls: true }],

    // Cosmetic differences from Standard
    'comma-dangle': ['error', 'always-multiline'],
    '@typescript-eslint/space-before-function-paren': ['error', 'never'],

    // Import verification doesn't work with advanced Yarn dependency protocols like "workspace:"
    // TypeScript does this anyway
    'import/no-unresolved': 'off',

    // Multiple same-name exports are useful for declaration merging. Shortcoming:
    // https://github.com/import-js/eslint-plugin-import/issues/1964
    'import/export': 'off',

    // Order of import statements
    'import/order': ['error', {
      alphabetize: { order: 'asc' },
      // Put same-directory imports last, as if they were './'
      pathGroups: [{ pattern: './*', group: 'index' }],
    }],

    // Order of members WITHIN import statements
    'sort-imports': ['error', {
      ignoreDeclarationSort: true, // Disable. let previous rule do this
    }],

    // Prefer `function` over `const` with arrow-function
    'func-style': ['error', 'declaration'],

    // Allow explicit `any`. However, you should prefer `unknown`
    '@typescript-eslint/no-explicit-any': 'off',

    // Allow using ! postfix operator for force non-emptiness
    '@typescript-eslint/no-non-null-assertion': 'off',

    // Allow explicit `any` in function param list
    // Also, lack of function return type becomes 'error' instead of 'warning'
    '@typescript-eslint/explicit-module-boundary-types': ['error', {
      allowArgumentsExplicitlyTypedAsAny: true,
    }],

    // Allow empty interfaces that use `extends`. Useful for declaration merging
    '@typescript-eslint/no-empty-interface': ['error', { allowSingleExtends: true }],

    // There are problems with indenting TypeScript generics:
    // https://github.com/typescript-eslint/typescript-eslint/issues/1824
  },
  overrides: [{
    files: '*.cjs',
    rules: {
      // Allow require() statements in CJS modules
      '@typescript-eslint/no-var-requires': 'off',
    },
  }],
  ignorePatterns: [
    'dist',
    '/scripts/data',
    '/packages/temporal-polyfill/e2e',
  ],
}

// Derived from the `standard-with-typescript` project:
// https://github.com/standard/eslint-config-standard-with-typescript/blob/master/src/index.ts
function buildTsRules() {
  const rules = {
    'no-undef': 'off', // TypeScript has this functionality by default
    'no-use-before-define': 'off',
  }
  // Some entries are commented out because they require TypeScript parserServices,
  // which is slow and impossible to do in TypeScript monorepos
  const equivalents = [
    'comma-spacing',
    // 'dot-notation', // Needs parserServices
    'brace-style',
    'func-call-spacing',
    'indent',
    'keyword-spacing',
    'lines-between-class-members',
    'no-array-constructor',
    'no-dupe-class-members',
    'no-redeclare',
    // 'no-throw-literal', // Needs parserServices
    'no-unused-vars',
    'no-unused-expressions',
    'no-useless-constructor',
    'quotes',
    'semi',
    'space-before-function-paren',
  ]
  for (const ruleName of equivalents) {
    rules[ruleName] = 'off'
    rules[`@typescript-eslint/${ruleName}`] = standardConfig.rules[ruleName]
  }
  return rules
}
