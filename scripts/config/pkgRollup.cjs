const fs = require('fs/promises')
const { analyzePkgConfig, getPkgConfig } = require('../lib/pkgAnalyze.cjs')
const resolve = require('@rollup/plugin-node-resolve').default
const sucrase = require('@rollup/plugin-sucrase')
const { terser } = require('rollup-plugin-terser')
const dts = require('rollup-plugin-dts').default
const { typePreparing } = require('../lib/pkgTypes.cjs')
const terserConfig = require('./terser.json')

module.exports = (commandLineArgs) => {
  const { watch } = commandLineArgs
  const pkgAnalysis = analyzePkgConfig(getPkgConfig(process.cwd()))
  const { entryPoints, entryPointTypes, globalEntryPoints, dependencyNames } = pkgAnalysis

  return [
    entryPoints.length && {
      input: entryPoints,
      external: dependencyNames,
      output: [
        buildOutputConfig('es', '.mjs', true),
        buildOutputConfig('cjs', '.cjs', true),
      ],
      plugins: buildPlugins(watch),
    },
    ...globalEntryPoints.map((globalEntryPoint) => ({
      input: globalEntryPoint,
      external: dependencyNames,
      output: buildGlobalOutputConfig(),
      plugins: buildPlugins(watch),
    })),
    (entryPointTypes.length && !watch) && {
      input: entryPointTypes,
      external: dependencyNames,
      output: buildOutputConfig('es', '.d.ts', false),
      plugins: [dts(), typePreparing()],
    },
  ]
}

// Output config
// -------------------------------------------------------------------------------------------------

function buildOutputConfig(format, extension, sourcemap) {
  return {
    format,
    dir: 'dist',
    entryFileNames: '[name]' + extension,
    chunkFileNames: 'common-[hash]' + extension,
    sourcemap,
    sourcemapExcludeSources: true,
  }
}

function buildGlobalOutputConfig() {
  return {
    format: 'iife',
    dir: 'dist',
    // no code splitting
    sourcemap: true,
    sourcemapExcludeSources: true,
  }
}

// Rollup plugins
// -------------------------------------------------------------------------------------------------

function buildPlugins(watch) {
  return [
    resolve({
      extensions: ['.js', '.ts'],
    }),
    sucrase({
      transforms: ['typescript'],
    }),
    tsFileOverriding('.build.ts'),
    !watch && terser(terserConfig),
  ]
}

// a Rollup plugin
function tsFileOverriding(forcedExtension) {
  return {
    load: async(id) => {
      const match = id.match(/^(.*)\.ts$/)
      if (match) {
        const altPath = match[1] + forcedExtension
        try {
          return await fs.readFile(altPath, 'utf8')
        } catch (err) {}
      }
      return null
    },
  }
}
