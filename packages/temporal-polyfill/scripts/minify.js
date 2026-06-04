#!/usr/bin/env node

import { join as joinPaths } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { minify as minifyWithTerser } from 'terser'
import { extensions } from './lib/config.js'
import {
  buildSwcMinifyOptions,
  buildTerserOptions,
  readTemporalReservedWords,
} from './lib/terser-options.js'

minifyIifeFiles(joinPaths(process.argv[1], '../..'))

async function minifyIifeFiles(pkgDir) {
  const pkgJsonPath = joinPaths(pkgDir, 'package.json')
  const pkgJson = JSON.parse(await readFile(pkgJsonPath))
  const minifier = process.env.MINIFIER || 'terser'
  const temporalReservedWords =
    minifier === 'terser' ? await readTemporalReservedWords(pkgDir) : undefined

  console.log(`Using ${minifier} minifier`)

  for (const exportPath in pkgJson.buildConfig.exports) {
    const exportConfig = pkgJson.buildConfig.exports[exportPath]

    if (exportConfig.iife) {
      const exportName =
        exportPath === '.' ? 'index' : exportPath.replace(/^\.\//, '')
      const inputPath = joinPaths('dist', exportName + extensions.iife)
      const outputPath = joinPaths('dist', exportName + extensions.iifeMin)
      const code = await readFile(joinPaths(pkgDir, inputPath), 'utf-8')
      const result = await minifyCode(code, minifier, temporalReservedWords)

      await writeFile(joinPaths(pkgDir, outputPath), result.code)
      console.log(`Minified ${inputPath} with ${minifier}`)
    }
  }
}

async function minifyCode(code, minifier, temporalReservedWords) {
  if (minifier === 'swc') {
    const { minify: minifyWithSwc } = await import('@swc/core')

    return minifyWithSwc(code, buildSwcMinifyOptions())
  }

  if (minifier === 'terser') {
    return minifyWithTerser(
      code,
      buildTerserOptions({
        mangleProps: true,
        manglePropsExcept: temporalReservedWords,
      }),
    )
  }

  throw new Error(`Unsupported MINIFIER: ${minifier}`)
}
