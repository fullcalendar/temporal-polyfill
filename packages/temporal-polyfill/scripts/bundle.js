#!/usr/bin/env node

import { join as joinPaths, basename } from 'path'
import { readFile } from 'fs/promises'
import { rollup as rollupBuild, watch as rollupWatch } from 'rollup'
import sourcemaps from 'rollup-plugin-sourcemaps'

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
        output: {
          format: 'iife',
          file: joinPaths('dist', shortName + extensions.iife),
          sourcemap: isDev,
          sourcemapExcludeSources: true
        },
        plugins: [
          // for reading sourcemaps from tsc
          isDev && sourcemaps(),
        ]
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
          chunkFileNames: 'chunk-[hash]' + extensions.cjs,
        },
        {
          format: 'es',
          dir: 'dist',
          entryFileNames: '[name]' + extensions.esm,
          chunkFileNames: 'chunk-[hash]' + extensions.esm,
        }
      ]
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
