#!/usr/bin/env node

import { join as joinPaths, dirname } from 'path'
import { readFile } from 'fs/promises'
import { rollup } from 'rollup'

const extensions = {
  esm: '.esm.js',
  cjs: '.cjs',
  iife: '.js',
}

writeBundles(
  joinPaths(dirname(process.argv[1]), '..')
)

async function writeBundles(pkgDir) {
  const pkgJsonPath = joinPaths(pkgDir, 'package.json')
  const pkgJson = JSON.parse(await readFile(pkgJsonPath))
  const exportsMap = pkgJson.buildConfig.exports
  const moduleInputs = {}
  const iifeConfigs = []

  for (const exportPath in exportsMap) {
    const exportConfig = exportsMap[exportPath]
    const shortName = exportPath === '.' ? 'index' : exportPath.replace(/^\.\//, '')
    const inputPath = joinPaths(pkgDir, 'dist', '.tsc', shortName + '.js')

    moduleInputs[shortName] = inputPath

    if (exportConfig.iife) {
      iifeConfigs.push({
        input: inputPath,
        onwarn,
        output: {
          format: 'iife',
          file: joinPaths('dist', shortName + extensions.iife),
        }
      })
    }
  }

  const configs = [
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

  await Promise.all(
    configs.map(async (config) => {
      const bundle = await rollup(config)

      return Promise.all(
        arrayify(config.output).map((outputConfig) => {
          return bundle.write(outputConfig)
        })
      )
    })
  )
}

function onwarn(warning) {
  if (warning.code !== 'CIRCULAR_DEPENDENCY') {
    console.error(warning.toString())
  }
}

function arrayify(input) {
  return Array.isArray(input) ? input : (input == null ? [] : [input])
}
