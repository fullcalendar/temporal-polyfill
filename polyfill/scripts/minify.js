#!/usr/bin/env node

import { join as joinPaths } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { minify as minifyWithTerser } from 'terser'
import { minifyPathMap } from './lib/config.js'
import {
  buildSwcMinifyOptions,
  buildTerserMinifyOptions,
} from './lib/minify-options.js'

minifyIifeFiles(joinPaths(process.argv[1], '../..'))

async function minifyIifeFiles(pkgDir) {
  const minifier = process.env.MINIFIER || 'terser'

  console.log(`Using ${minifier} minifier`)

  for (const [inputPath, outputPath] of Object.entries(minifyPathMap)) {
    const code = await readFile(joinPaths(pkgDir, inputPath), 'utf-8')
    const result = await minifyCode(code, minifier)

    await writeFile(joinPaths(pkgDir, outputPath), result.code)
    console.log(`Minified ${inputPath} with ${minifier}`)
  }
}

async function minifyCode(code, minifier) {
  if (minifier === 'swc') {
    const { minify: minifyWithSwc } = await import('@swc/core')

    return minifyWithSwc(code, buildSwcMinifyOptions())
  }

  if (minifier === 'terser') {
    return minifyWithTerser(code, buildTerserMinifyOptions())
  }

  throw new Error(`Unsupported MINIFIER: ${minifier}`)
}
