const fs = require('fs/promises')
const { analyzePkgConfig, getPkgConfig } = require('../lib/pkgAnalyze.cjs')
const resolve = require('@rollup/plugin-node-resolve').default
const sucrase = require('@rollup/plugin-sucrase')
const { terser } = require('rollup-plugin-terser')
const dts = require('rollup-plugin-dts').default
const { createTypeInputHash, typePreparing } = require('../lib/pkgTypes.cjs')
const terserConfig = require('./terser.json')

module.exports = (commandLineArgs) => {
  const { watch } = commandLineArgs
  const pkgAnalysis = analyzePkgConfig(getPkgConfig(process.cwd()))
  const { entryPoints, entryPointTypes, globalEntryPoints, dependencyNames } = pkgAnalysis

  const configs = globalEntryPoints.map((globalEntryPoint) => ({
    input: globalEntryPoint,
    external: dependencyNames,
    output: buildGlobalOutputConfig(),
    plugins: buildPlugins(watch),
  }))

  if (entryPoints.length) {
    configs.push({
      input: entryPoints,
      external: dependencyNames,
      output: [
        buildOutputConfig('es', '.mjs', true),
        buildOutputConfig('cjs', '.cjs', true),
      ],
      plugins: buildPlugins(watch),
    })
  }

  if (entryPointTypes.length && !watch) {
    configs.push({
      input: createTypeInputHash(entryPointTypes),
      external: dependencyNames,
      output: buildOutputConfig('es', '.d.ts', false),
      plugins: [dts(), typePreparing()],
    })
  }

  // if there are no configs, will throw an error
  // must prevent Rollup compilation from happening altogether if package doesn't need building
  return configs
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
