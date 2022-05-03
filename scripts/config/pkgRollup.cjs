const fs = require('fs/promises')
const { analyzePkgConfig2, getPkgConfigAtRoot } = require('../lib/pkgAnalyze.cjs')
const resolve = require('@rollup/plugin-node-resolve').default
const sucrase = require('@rollup/plugin-sucrase')
const { terser } = require('rollup-plugin-terser')

module.exports = (commandLineArgs) => {
  const { watch } = commandLineArgs
  const { entryPoints, globalEntryPoint, dependencyNames } = analyzePkgConfig2(getPkgConfigAtRoot())

  return [
    {
      input: entryPoints,
      external: dependencyNames,
      output: [
        buildOutputConfig('es', '.mjs'),
        buildOutputConfig('cjs', '.cjs'),
      ],
      plugins: buildPlugins(watch),
    },
    globalEntryPoint && {
      input: globalEntryPoint,
      external: dependencyNames,
      output: buildGlobalOutputConfig(),
      plugins: buildPlugins(watch),
    },
  ]
}

function buildOutputConfig(format, extension) {
  return {
    format,
    dir: 'dist',
    entryFileNames: '[name]' + extension,
    chunkFileNames: 'common-[hash]' + extension,
    sourcemap: true,
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

function buildPlugins(watch) {
  return [
    resolve({
      extensions: ['.js', '.ts'],
    }),
    sucrase({
      exclude: ['node_modules/**'],
      transforms: ['typescript'],
    }),
    tsFileOverriding('.build.ts'),
    !watch && terser(), // TODO: use terser.json config (import json)
  ]
}

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
