#!/usr/bin/env node

import { join as joinPaths, basename, resolve as resolvePath, sep as pathSep } from 'path'
import { readFile, copyFile } from 'fs/promises'
import { rollup as rollupBuild, watch as rollupWatch } from 'rollup'
import sourcemaps from 'rollup-plugin-sourcemaps'
import { dts } from 'rollup-plugin-dts'
import { pureTopLevel } from './pure-top-level.js'
import { terserSimple } from './terser-simple.js'
import { extensions } from './config.js'

writeBundles(
  joinPaths(process.argv[1], '../..'),
  process.argv.slice(2).includes('--dev'),
)

async function writeBundles(pkgDir, isDev) {
  const configs = await buildConfigs(pkgDir, isDev)

  await (isDev ? watchWithConfigs : buildWithConfigs)(configs)
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
  const useChunkNames = isDev

  for (const exportPath in exportMap) {
    const exportConfig = exportMap[exportPath]
    const exportName = exportPath === '.' ? 'index' : exportPath.replace(/^\.\//, '')
    const srcPath = joinPaths(pkgDir, 'dist/.tsc', (exportConfig.src || exportName) + '.js')

    moduleInputs[exportName] = srcPath

    if (exportConfig.types) {
      // HACK because running global side-effects through dts causes weird imports
      await copyFile(
        joinPaths(pkgDir, 'src', exportConfig.types + extensions.dts),
        joinPaths(pkgDir, 'dist', exportName + extensions.dts),
      )
    } else {
      dtsInputs[exportName] = joinPaths(pkgDir, 'dist/.tsc', (exportConfig.src || exportName) + extensions.dts)
    }

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
              !isDev && buildTerserPlugin({
                humanReadable: true,
                optimize: true,
              })
            ],
          },
          !isDev && {
            format: 'iife',
            file: joinPaths('dist', exportName + extensions.iifeMin),
            plugins: [
              buildTerserPlugin({
                optimize: true,
                mangleProps: true,
                manglePropsExcept: temporalReservedWords,
              }),
            ]
          }
        ],
      })
    }
  }

  const fullTscInternalPath = resolvePath(pkgDir, 'dist/.tsc', 'internal') + pathSep

  function manuallyResolveChunk(id) {
    if (id.startsWith(fullTscInternalPath)) {
      return 'internal'
    }
  }

  if (!isDev && Object.keys(dtsInputs).length) {
    dtsConfigs.push({
      input: dtsInputs,
      onwarn,
      plugins: [dts()],
      output: {
        format: 'es',
        dir: 'dist',
        entryFileNames: '[name]' + extensions.dts,
        chunkFileNames: 'chunks/' + (useChunkNames ? '[name]' : '[hash]') + extensions.dts,
        minifyInternalExports: false,
        manualChunks: manuallyResolveChunk,
      }
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
          chunkFileNames: 'chunks/' + (useChunkNames ? '[name]' : '[hash]') + extensions.cjs,
          minifyInternalExports: false,
          manualChunks: manuallyResolveChunk,
          plugins: [
            !isDev && buildTerserPlugin({
              humanReadable: true,
              optimize: true,
              // don't mangleProps. CJS require/exports names are affected
            })
          ]
        },
        {
          format: 'es',
          dir: 'dist',
          entryFileNames: '[name]' + extensions.esm,
          chunkFileNames: 'chunks/' + (useChunkNames ? '[name]' : '[hash]') + extensions.esm,
          minifyInternalExports: false,
          manualChunks: manuallyResolveChunk,
          plugins: [
            !isDev && pureTopLevel(),
            !isDev && buildTerserPlugin({
              humanReadable: true,
              optimize: true,
              mangleProps: true,
              manglePropsExcept: temporalReservedWords,
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
        })
      )
    })
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
  return Array.isArray(input) ? input : (input == null ? [] : [input])
}

// Terser
// -------------------------------------------------------------------------------------------------

const terserNameCache = {}

function buildTerserPlugin({
  humanReadable = false,
  optimize = false,
  mangleProps = false,
  manglePropsExcept,
}) {
  const mangleOptions = mangleProps && {
    properties: {
      reserved: manglePropsExcept,
      keep_quoted: true,
    },
    // Unfortunately can't just mangle props and nothing else, so retain:
    keep_fnames: humanReadable,
    keep_classnames: humanReadable,
  }

  if (mangleProps && humanReadable) {
    // Don't mangle top-level var/funcs, especially ESM imports
    // Must force module:false to allow toplevel to take effect
    mangleOptions.module = false
    mangleOptions.toplevel = false
  }

  return terserSimple({
    compress: optimize && {
      ecma: 2018,
      passes: 3, // enough to remove dead object assignment, get lower size
      keep_fargs: false, // remove unused function args
      unsafe_arrows: true,
      unsafe_methods: true,
      booleans_as_integers: true,
      hoist_funs: true,
    },
    mangle: mangleOptions,
    nameCache: terserNameCache, // for consistent mangling across chunks/files
    format: {
      beautify: humanReadable,
      braces: humanReadable,
      indent_level: 2,
      preserve_annotations: true, // like PURE annotations
    },
  })
}

// Temporal Reserved Words
// -------------------------------------------------------------------------------------------------

const startsWithLetterRegExp = /^[a-zA-Z]/

async function readTemporalReservedWords(pkgDir) {
  const code = await readFile(joinPaths(pkgDir, '../temporal-spec/global.d.ts'), 'utf-8')
  return code.split(/\W+/)
    .filter((symbol) => symbol && startsWithLetterRegExp.test(symbol))
    .concat([
      'resolvedOptions',
      'useGrouping',
      'relatedYear',
    ])
}
