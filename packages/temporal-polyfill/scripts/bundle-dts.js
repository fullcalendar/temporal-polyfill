#!/usr/bin/env node

import {
  basename,
  join as joinPaths,
  resolve as resolvePath,
  sep as pathSep,
} from 'path'
import { readFile } from 'fs/promises'
import { rollup as rollupBuild, watch as rollupWatch } from 'rollup'
import { dts as dtsPlugin } from 'rollup-plugin-dts'
import { extensions } from './lib/config.js'

const argv = process.argv.slice(2)
writeBundles(joinPaths(process.argv[1], '../..'), argv.includes('--dev'))

async function writeBundles(pkgDir, isDev) {
  const configs = await buildConfigs(pkgDir, isDev)
  await (isDev ? watchWithConfigs : buildWithConfigs)(configs)
}

async function buildConfigs(pkgDir, isDev) {
  const pkgJsonPath = joinPaths(pkgDir, 'package.json')
  const pkgJson = JSON.parse(await readFile(pkgJsonPath))
  const exportMap = pkgJson.buildConfig.exports
  const dtsInputs = {}
  const dtsConfigs = []
  const chunkNamesEnabled = isDev
  const chunkBase = 'chunks/' + (chunkNamesEnabled ? '[name]' : '[hash]')
  const internalDtsBase = resolvePath(pkgDir, 'dist/.tsc', 'internal') + pathSep

  for (const exportPath in exportMap) {
    const exportConfig = exportMap[exportPath]
    const exportName =
      exportPath === '.' ? 'index' : exportPath.replace(/^\.\//, '')

    const dtsPath = joinPaths(
      pkgDir,
      'dist/.tsc',
      (exportConfig.types || exportConfig.src || exportName) + extensions.dts,
    )

    dtsInputs[exportName] = dtsPath
  }

  if (!isDev && Object.keys(dtsInputs).length) {
    dtsConfigs.push({
      input: dtsInputs,
      onwarn,
      plugins: [
        // Will not bundle external packages by default
        dtsPlugin(),
        // WORKAROUND: dts plugin was including empty import statements,
        // despite attempting hoistTransitiveImports:false. Especially bad
        // because temporal-spec/global was being imported from index.
        {
          renderChunk(code) {
            return code.replace(/^import ['"][^'"]*['"](;|$)/m, '')
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
          if (id.startsWith(internalDtsBase)) {
            return 'internal'
          }
        },
      },
    })
  }

  return dtsConfigs
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
