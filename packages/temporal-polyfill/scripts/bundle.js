#!/usr/bin/env node

import { join as joinPaths, basename } from 'path'
import { readFile } from 'fs/promises'
import { rollup as rollupBuild, watch as rollupWatch } from 'rollup'
import sourcemaps from 'rollup-plugin-sourcemaps'
import terser from '@rollup/plugin-terser'

// TODO: make DRY with pkg-json.js
const extensions = {
  esm: '.esm.js',
  cjs: '.cjs',
  iife: '.js',
}

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

  for (const exportPath in exportMap) {
    const exportConfig = exportMap[exportPath]
    const shortName = exportPath === '.' ? 'index' : exportPath.replace(/^\.\//, '')
    const inputPath = joinPaths(pkgDir, 'dist/.tsc', shortName + '.js')

    moduleInputs[shortName] = inputPath

    if (exportConfig.iife) {
      iifeConfigs.push({
        input: inputPath,
        onwarn,
        plugins: [
          // for reading sourcemaps from tsc
          isDev && sourcemaps(),
        ],
        output: [
          {
            format: 'iife',
            file: joinPaths('dist', shortName + extensions.iife),
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
            file: joinPaths('dist', shortName + '.min' + extensions.iife),
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

  return [
    {
      input: moduleInputs,
      onwarn,
      output: [
        {
          format: 'cjs',
          dir: 'dist',
          entryFileNames: '[name]' + extensions.cjs,
          chunkFileNames: `chunk-[${isDev ? 'name' : 'hash'}]` + extensions.cjs,
          // terser property rename doesn't work for cjs
        },
        {
          format: 'es',
          dir: 'dist',
          entryFileNames: '[name]' + extensions.esm,
          chunkFileNames: `chunk-[${isDev ? 'name' : 'hash'}]` + extensions.esm,
          plugins: [
            !isDev && buildTerserPlugin({
              humanReadable: true,
              mangleProps: true,
              manglePropsExcept: temporalReservedWords,
            })
          ],
        }
      ],
    },
    ...iifeConfigs,
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

const terserNameCache = {} // for keeping prop mangling consistent across files

function buildTerserPlugin({
  humanReadable = false,
  optimize = false,
  mangleProps = false,
  manglePropsExcept,
}) {
  return terser({
    compress: optimize && {
      ecma: 2018,
      passes: 3, // enough to remove dead object assignment, get lower size
      keep_fargs: false, // remove unused function args
      unsafe_arrows: true,
    },
    // Unfortunately can't just mangle props and nothing else
    mangle: mangleProps && {
      keep_fnames: humanReadable,
      keep_classnames: humanReadable,
      reserved: [
        'Calendar',
        'Duration',
        'Instant',
        'Now',
        'PlainDate',
        'PlainDateTime',
        'PlainMonthDay',
        'PlainTime',
        'PlainYearMonth',
        'TimeZone',
        'ZonedDateTime',
      ],
      properties: {
        reserved: manglePropsExcept,
        keep_quoted: true,
      },
    },
    format: {
      beautify: humanReadable,
      // comments: humanReadable ? 'all' : 'some', // never do comments. always out of order
      indent_level: 2,
    },
    nameCache: terserNameCache,
  })
}

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
