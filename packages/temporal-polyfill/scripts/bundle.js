#!/usr/bin/env node

import {
  basename,
  dirname,
  join as joinPaths,
  relative as relativePath,
  resolve as resolvePath,
  sep as pathSep,
} from 'path'
import { readFile } from 'fs/promises'
import { rollup as rollupBuild, watch as rollupWatch } from 'rollup'
import { dts } from 'rollup-plugin-dts'
import sourcemaps from 'rollup-plugin-sourcemaps'
import { minify as swcMinify } from 'rollup-plugin-swc3'
import { extensions } from './lib/config.js'
import { pureTopLevel } from './lib/pure-top-level.js'
import { terserSimple } from './lib/terser-simple.js'

const argv = process.argv.slice(2)

// These options only affect the Test262 artifact. Public dist always builds in
// auto mode so the published files do not vary with Test262 matrix settings.
const test262ForceShim = readBooleanFlag(
  argv,
  '--test262-force-shim',
  'TEST262_FORCE_SHIM',
  true,
)
const test262ClassApi = readEnumFlag(
  argv,
  '--test262-class-api',
  'TEST262_CLASS_API',
  ['full', 'core'],
)
const test262Minifier = readOptionalEnumFlag(
  argv,
  '--test262-minifier',
  'TEST262_MINIFIER',
  ['terser', 'swc'],
)

writeBundles(
  joinPaths(process.argv[1], '../..'),
  argv.includes('--dev'),
  test262ForceShim,
  test262ClassApi,
  test262Minifier,
)

async function writeBundles(
  pkgDir,
  isDev,
  test262ForceShim,
  test262ClassApi,
  test262Minifier,
) {
  const configs = await buildConfigs(pkgDir, isDev)
  await (isDev ? watchWithConfigs : buildWithConfigs)(configs)

  const test262Config = await buildTest262Config({
    pkgDir,
    test262ForceShim,
    test262ClassApi,
    test262Minifier,
  })
  await buildWithConfigs([test262Config])
}

async function buildConfigs(pkgDir, isDev) {
  const temporalReservedWords = await readTemporalReservedWords(pkgDir)

  const pkgJsonPath = joinPaths(pkgDir, 'package.json')
  const pkgJson = JSON.parse(await readFile(pkgJsonPath))
  const isExternalDependency = buildExternalDependencyResolver(pkgJson)
  const exportMap = pkgJson.buildConfig.exports
  const moduleInputs = {}
  const iifeConfigs = []
  const dtsInputs = {}
  const dtsConfigs = []
  const chunkNamesEnabled = true // isDev
  const chunkBase = 'chunks/' + (chunkNamesEnabled ? '[name]' : '[hash]')
  const sourceDirectoryChunksPlugin = buildSourceDirectoryChunksPlugin(
    resolvePath(pkgDir, 'dist/.tsc'),
  )

  const definePlugin = buildDefinePlugin({
    __FORCE_SHIM_IMPLEMENTATION__: false,
  })

  for (const exportPath in exportMap) {
    const exportConfig = exportMap[exportPath]
    const exportName =
      exportPath === '.' ? 'index' : exportPath.replace(/^\.\//, '')

    // TODO: rename to 'transpiled' path?
    const srcPath = joinPaths(
      pkgDir,
      'dist/.tsc',
      (exportConfig.src || exportName) + '.js',
    )
    const dtsPath = joinPaths(
      pkgDir,
      'dist/.tsc',
      (exportConfig.types || exportConfig.src || exportName) + extensions.dts,
    )

    moduleInputs[exportName] = srcPath
    dtsInputs[exportName] = dtsPath

    if (exportConfig.iife) {
      iifeConfigs.push({
        input: srcPath,
        onwarn,
        external: isExternalDependency,
        plugins: [
          definePlugin,
          // for reading sourcemaps from tsc
          isDev && sourcemaps(),
        ],
        output: [
          {
            format: 'iife',
            file: joinPaths('dist', exportName + extensions.iife),
            sourcemap: isDev,
            sourcemapExcludeSources: true,
            plugins: [
              !isDev &&
                buildTerserPlugin({
                  humanReadable: true,
                }),
            ],
          },
          !isDev && {
            format: 'iife',
            file: joinPaths('dist', exportName + extensions.iifeMin),
            plugins: [
              buildTerserPlugin({
                mangleProps: true,
                manglePropsExcept: temporalReservedWords,
              }),
            ],
          },
        ],
      })
    }
  }

  if (!isDev && Object.keys(dtsInputs).length) {
    dtsConfigs.push({
      input: dtsInputs,
      onwarn,
      external: isExternalDependency,
      plugins: [
        // Will not bundle external packages by default
        dts(),

        {
          // WORKAROUND: dts plugin was including empty import statements,
          // despite attempting hoistTransitiveImports:false. Especially bad
          // because temporal-spec/global was being imported from index.
          renderChunk(code) {
            return code.replace(/^import ['"][^'"]*['"](;|$)/gm, '')
          },
        },
        sourceDirectoryChunksPlugin,
      ],
      output: {
        format: 'es',
        dir: 'dist',
        entryFileNames: '[name]' + extensions.dts,
        chunkFileNames: chunkBase + extensions.dts,
        minifyInternalExports: false,
      },
    })
  }

  return [
    {
      input: moduleInputs,
      onwarn,
      external: isExternalDependency,
      plugins: [definePlugin, sourceDirectoryChunksPlugin],
      output: {
        format: 'es',
        dir: 'dist',
        entryFileNames(chunkInfo) {
          const exportName = chunkInfo.name
          const exportPath = exportName === 'index' ? '.' : './' + exportName

          const esmExtension =
            (exportMap[exportPath].iife ? extensions.esmWhenIifePrefix : '') +
            extensions.esm

          return exportName + esmExtension
        },
        chunkFileNames: chunkBase + extensions.esm,
        minifyInternalExports: false,
        hoistTransitiveImports: false,
        // If you're tempted to write sourcemaps to ESM, don't!
        // They don't play well with vitest it seems. Not accurate.
        //// sourcemap: isDev,
        //// sourcemapExcludeSources: true,
        plugins: [
          !isDev && pureTopLevel(),
          !isDev &&
            buildTerserPlugin({
              humanReadable: true,
              mangleProps: true,
              manglePropsExcept: temporalReservedWords,
              preserveAnnotations: true,
            }),
        ],
      },
    },
    ...iifeConfigs,
    ...dtsConfigs,
  ]
}

function buildWithConfigs(configs) {
  return Promise.all(
    configs.map(async (config) => {
      const bundle = await rollupBuild(config)

      return Promise.all(
        arrayify(config.output).map((outputConfig) => {
          if (outputConfig) {
            return bundle.write(outputConfig)
          }
        }),
      )
    }),
  )
}

async function watchWithConfigs(configs) {
  const rollupWatcher = rollupWatch(configs)

  return new Promise((resolve) => {
    rollupWatcher.on('event', (ev) => {
      switch (ev.code) {
        case 'ERROR':
          console.error(ev.error)
          break
        case 'BUNDLE_END':
          console.log(formatWriteMessage(ev.input))
          ev.result.close() // our responsibility to call this
          break
        case 'END':
          resolve()
          break
      }
    })
  })
}

function formatWriteMessage(input) {
  const inputPaths = typeof input === 'object' ? Object.values(input) : [input]
  const inputNames = inputPaths.map((inputPath) => basename(inputPath))

  return `Bundled ${inputNames.join(', ')}`
}

function onwarn(warning) {
  if (warning.code !== 'CIRCULAR_DEPENDENCY') {
    console.error(warning.toString())
  }
}

function buildExternalDependencyResolver(pkgJson) {
  const dependencyNames = Object.keys(pkgJson.dependencies || {})

  return (id) => {
    // Bare package imports are runtime dependencies, not bundled source files.
    // Mark them external explicitly so Rollup doesn't warn while preserving
    // any package subpath imports the dependency might expose later.
    return dependencyNames.some((dependencyName) => {
      return id === dependencyName || id.startsWith(dependencyName + '/')
    })
  }
}

// Test262
// -----------------------------------------------------------------------------

async function buildTest262Config({
  pkgDir,
  test262ForceShim,
  test262ClassApi,
  test262Minifier,
}) {
  const temporalReservedWords = await readTemporalReservedWords(pkgDir)
  const pkgJsonPath = joinPaths(pkgDir, 'package.json')
  const pkgJson = JSON.parse(await readFile(pkgJsonPath))
  const isExternalDependency = buildExternalDependencyResolver(pkgJson)
  const globalInput = joinPaths(
    pkgDir,
    'dist',
    test262ClassApi === 'full'
      ? 'full/global' + extensions.esmWhenIifePrefix + extensions.esm
      : 'global' + extensions.esmWhenIifePrefix + extensions.esm,
  )
  const test262ForceShimInput = 'virtual:test262-force-shim'
  const outputFile = joinPaths(pkgDir, 'dist', '.test262.global.js')

  return {
    input: test262ForceShim ? test262ForceShimInput : globalInput,
    onwarn,
    external: isExternalDependency,
    plugins: test262ForceShim
      ? [
          buildTest262ForceShimEntryPlugin({
            input: test262ForceShimInput,
            pkgDir,
            test262ClassApi,
          }),
        ]
      : [],
    output: {
      format: 'iife',
      name: 'TemporalPolyfillTest262',
      file: outputFile,
      plugins: [
        test262Minifier === 'swc' && swcMinify(),
        test262Minifier === 'terser' &&
          buildTerserPlugin({
            mangleProps: true,
            manglePropsExcept: temporalReservedWords,
          }),
      ],
    },
  }
}

function buildTest262ForceShimEntryPlugin({ input, pkgDir, test262ClassApi }) {
  const shimPath = joinPaths(
    pkgDir,
    'dist',
    test262ClassApi === 'full' ? 'full/shim.js' : 'shim.js',
  )

  return {
    name: 'test262-force-shim-entry',
    resolveId(id) {
      if (id === input) {
        return input
      }
    },
    load(id) {
      if (id !== input) {
        return
      }

      // The public shim entry intentionally has no install side effect. Test262
      // needs a global Temporal, so this synthetic entry calls the unconditional
      // installer while still bundling from production ESM.
      return `import { installImplementation } from ${JSON.stringify(shimPath)}

installImplementation()
`
    },
  }
}

// Terser
// -----------------------------------------------------------------------------

const terserNameCache = {}

function buildTerserPlugin({
  humanReadable = false,
  mangleProps = false,
  preserveAnnotations = false,
  manglePropsExcept,
}) {
  return terserSimple({
    compress: {
      ecma: 2018,
      passes: 3, // enough to remove dead object assignment, get lower size
      keep_fargs: false, // remove unused function args
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
  })
}

// Temporal Reserved Words
// -----------------------------------------------------------------------------

const startsWithLetterRegExp = /^[a-zA-Z]/

async function readTemporalReservedWords(pkgDir) {
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
      'hour',
      'hour12',
      'hourCycle',
      'localeMatcher',
      'minute',
      'month',
      'numberingSystem',
      'second',
      'timeStyle',
      'timeZone',
      'timeZoneName',
      'weekday',
      'year',
    ])
}

// Rollup Utils
// -----------------------------------------------------------------------------

function buildSourceDirectoryChunksPlugin(sourceRoot) {
  return {
    name: 'source-directory-chunks',
    outputOptions(outputOptions) {
      const originalManualChunks = outputOptions.manualChunks

      return {
        ...outputOptions,
        manualChunks(id, meta) {
          const chunkName = resolveSourceDirectoryChunkName(id, sourceRoot)

          if (chunkName) {
            return chunkName
          }

          if (typeof originalManualChunks === 'function') {
            return originalManualChunks(id, meta)
          }
        },
      }
    },
  }
}

// Match the Rollup chunk name to the source file's directory under `dist/.tsc`.
// Top-level files go to `root`; nested paths are flattened so
// `funcApi/native/foo.js` becomes the `funcApi-native` chunk instead of writing
// into a nested `chunks/funcApi/native.*` output path.
function resolveSourceDirectoryChunkName(id, sourceRoot) {
  const sourceRootWithSep = sourceRoot + pathSep

  if (!id.startsWith(sourceRootWithSep)) {
    return
  }

  const sourceDir = dirname(relativePath(sourceRoot, id))

  return sourceDir === '.' ? 'root' : sourceDir.split(pathSep).join('-')
}

function buildDefinePlugin(defines) {
  const replacements = Object.entries(defines).map(([key, value]) => [
    key,
    JSON.stringify(value),
  ])

  return {
    name: 'define',
    transform(code) {
      let nextCode = code

      for (const [key, value] of replacements) {
        nextCode = nextCode.replaceAll(key, value)
      }

      if (nextCode !== code) {
        return {
          code: nextCode,
          map: null,
        }
      }
    },
  }
}

// CLI Utils
// -----------------------------------------------------------------------------

function readArgValue(argv, flagName) {
  const flagPrefix = flagName + '='

  for (const arg of argv) {
    if (arg.startsWith(flagPrefix)) {
      return arg.substring(flagPrefix.length)
    }
  }
}

function readBooleanFlag(argv, flagName, envName, defaultValue = false) {
  if (argv.includes(flagName)) {
    return true
  }

  const envValue = process.env[envName]

  if (envValue === undefined || envValue === '') {
    return defaultValue
  }
  if (['1', 'true', 'yes'].includes(envValue)) {
    return true
  }
  if (['0', 'false', 'no'].includes(envValue)) {
    return false
  }

  throw new Error(
    `Invalid ${envName} value "${envValue}". Expected 1, true, yes, 0, false, or no.`,
  )
}

function readEnumFlag(argv, flagName, envName, values) {
  const value =
    readArgValue(argv, flagName) || process.env[envName] || values[0]

  if (!values.includes(value)) {
    throw new Error(
      `Invalid ${envName} value "${value}". Expected ${values.join(' or ')}.`,
    )
  }

  return value
}

function readOptionalEnumFlag(argv, flagName, envName, values) {
  const value = readArgValue(argv, flagName) || process.env[envName]

  if (value === undefined || value === '') {
    return
  }
  if (!values.includes(value)) {
    throw new Error(
      `Invalid ${envName} value "${value}". Expected ${values.join(' or ')}.`,
    )
  }

  return value
}

// Lang Utils
// -----------------------------------------------------------------------------

function arrayify(input) {
  return Array.isArray(input) ? input : input == null ? [] : [input]
}
