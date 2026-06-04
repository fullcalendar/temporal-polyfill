#!/usr/bin/env node

import { join as joinPaths } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { minify } from 'terser'
import { extensions } from './lib/config.js'
import {
  buildTerserOptions,
  readTemporalReservedWords,
} from './lib/terser-options.js'

minifyIifeFiles(joinPaths(process.argv[1], '../..'))

async function minifyIifeFiles(pkgDir) {
  const pkgJsonPath = joinPaths(pkgDir, 'package.json')
  const pkgJson = JSON.parse(await readFile(pkgJsonPath))
  const temporalReservedWords = await readTemporalReservedWords(pkgDir)

  for (const exportPath in pkgJson.buildConfig.exports) {
    const exportConfig = pkgJson.buildConfig.exports[exportPath]

    if (exportConfig.iife) {
      const exportName =
        exportPath === '.' ? 'index' : exportPath.replace(/^\.\//, '')
      const inputPath = joinPaths('dist', exportName + extensions.iife)
      const outputPath = joinPaths('dist', exportName + extensions.iifeMin)
      const code = await readFile(joinPaths(pkgDir, inputPath), 'utf-8')
      const result = await minify(
        code,
        buildTerserOptions({
          mangleProps: true,
          manglePropsExcept: temporalReservedWords,
        }),
      )

      await writeFile(joinPaths(pkgDir, outputPath), result.code)
      console.log(`Minified ${inputPath}`)
    }
  }
}
