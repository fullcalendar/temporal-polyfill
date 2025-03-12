#!/usr/bin/env node

import {
  basename,
  join as joinPaths,
  resolve as resolvePath,
  sep as pathSep,
} from 'path'
import { copyFile, readFile } from 'fs/promises'
import { rollup as rollupBuild, watch as rollupWatch } from 'rollup'
import { dts } from 'rollup-plugin-dts'
import sourcemaps from 'rollup-plugin-sourcemaps'
import { minify as swcMinify } from 'rollup-plugin-swc3'
import { extensions } from './lib/config.js'
import { pureTopLevel } from './lib/pure-top-level.js'
import { terserSimple } from './lib/terser-simple.js'

const argv = process.argv.slice(2)
writeBundles(
  joinPaths(process.argv[1], '../..'),
  argv.includes('--dev'),
  argv.includes('--esm') || process.env.TEST262_ESM === '1',
  argv.includes('--esm-terser') || process.env.TEST262_ESM === 'terser',
  argv.includes('--esm-swc') || process.env.TEST262_ESM === 'swc',
)

async function writeBundles(
  pkgDir,
  isDev,
  bundleEsm,
  bundleEsmTerser,
  bundleEsmSwc,
) {
  const configs = await buildConfigs(pkgDir, isDev)
  await (isDev ? watchWithConfigs : buildWithConfigs)(configs)

  if (bundleEsm || bundleEsmTerser || bundleEsmSwc) {
    const esmBundle = await rollupBuild({
      input: joinPaths(
        pkgDir,
        'dist',
        'global' + extensions.esmWhenIifePrefix + extensions.esm,
      ),
    })

    const filename =
      'global' +
      (bundleEsmTerser
        ? '.terser' + extensions.iifeMin
        : bundleEsmSwc
          ? '.swc' + extensions.iifeMin
          : extensions.iife)

    await esmBundle.write({
      format: 'iife',
      file: joinPaths(pkgDir, 'dist', '.bundled', filename),
      plugins: [bundleEsmTerser && terserSimple(), bundleEsmSwc && swcMinify()],
    })
  }
}

async function buildConfigs(pkgDir, isDev) {
  const temporalReservedWords = await readTemporalReservedWords(pkgDir)

  const pkgJsonPath = joinPaths(pkgDir, 'package.json')
  const pkgJson = JSON.parse(await readFile(pkgJsonPath))
  const exportMap = pkgJson.buildConfig.exports
  const moduleInputs = {}
  const iifeConfigs = []
  const dtsInputs = {}
  const dtsConfigs = []
  const chunkNamesEnabled = true // isDev
  const chunkBase = 'chunks/' + (chunkNamesEnabled ? '[name]' : '[hash]')
  const internalSrcBase = resolvePath(pkgDir, 'dist/.tsc', 'internal') + pathSep
  const classApiSrcBase = resolvePath(pkgDir, 'dist/.tsc', 'classApi') + pathSep
  const funcApiSrcBase = resolvePath(pkgDir, 'dist/.tsc', 'funcApi') + pathSep

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
        plugins: [
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

  function manuallyResolveChunk(id) {
    if (id.startsWith(internalSrcBase)) {
      return 'internal'
    }
    if (id.startsWith(funcApiSrcBase)) {
      return 'funcApi'
    }
    if (id.startsWith(classApiSrcBase)) {
      return 'classApi'
    }
  }

  if (!isDev && Object.keys(dtsInputs).length) {
    dtsConfigs.push({
      input: dtsInputs,
      onwarn,
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

          // Copy .d.ts to .d.cts (for CJS types)
          async writeBundle(_options, bundle) {
            for (const bundlePath in bundle) {
              let outputPath = bundlePath
              outputPath = outputPath.replace(extensions.dts, '')
              outputPath += '.d.cts'
              await copyFile(
                joinPaths(pkgDir, 'dist', bundlePath),
                joinPaths(pkgDir, 'dist', outputPath),
              )
            }
          },
        },
      ],
      output: {
        format: 'es',
        dir: 'dist',
        entryFileNames: '[name]' + extensions.dts,
        chunkFileNames: chunkBase + extensions.dts,
        minifyInternalExports: false,
        manualChunks(id) {
          // HACK to ensure fns/* files own their own stuff
          if (id.startsWith(funcApiSrcBase)) {
            const moduleName = id
              .substring(funcApiSrcBase.length)
              .replace(/\.d\.ts/, '')
            if (!moduleName.includes(pathSep)) {
              return 'fns/' + moduleName
            }
          }

          if (id.startsWith(internalSrcBase)) {
            return 'internal'
          }
          if (id.startsWith(funcApiSrcBase)) {
            return 'funcApi'
          }
          if (id.startsWith(classApiSrcBase)) {
            return 'classApi'
          }
        },
      },
    })
  }

  return [
    {
      input: moduleInputs,
      onwarn,
      output: [
        {
          format: 'cjs',
          dir: 'dist',
          entryFileNames: '[name]' + extensions.cjs,
          chunkFileNames: chunkBase + extensions.cjs,
          manualChunks: manuallyResolveChunk,
          minifyInternalExports: false,
          hoistTransitiveImports: false,
          plugins: [
            !isDev &&
              buildTerserPlugin({
                humanReadable: true,
                // don't mangleProps. CJS require/exports names are affected
              }),
          ],
        },
        {
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
          manualChunks: manuallyResolveChunk,
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
      ],
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
          return bundle.write(outputConfig)
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

function arrayify(input) {
  return Array.isArray(input) ? input : input == null ? [] : [input]
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
    ])
}
