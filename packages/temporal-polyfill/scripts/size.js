#!/usr/bin/env node

import { readFile } from 'fs/promises'
import { execLive, popFlag } from './lib/utils.js'

const argv = process.argv.slice(2)
displaySizes(
  popFlag(argv, '--output'),
  popFlag(argv, '--raw'),
  popFlag(argv, '--all'),
  argv,
)

/*
Only works when run from PNPM-run context, for bin paths
*/
async function displaySizes(
  debugOutput,
  rawSizes,
  allEntryPoints,
  entryPoints,
) {
  if (allEntryPoints) {
    const pkgJson = JSON.parse(await readFile('./package.json'))
    entryPoints = Object.keys(pkgJson.buildConfig.exports)
  }

  if (!entryPoints.length) {
    entryPoints = ['.']
  }

  // normalize, remove leading ./ (except for root, which leaves '.')
  entryPoints = entryPoints
    .map((entryPoint) => entryPoint.replace(/^\.\//, ''))
    .filter((entryPoint) => Boolean(entryPoint))

  if (entryPoints.length > 1 && debugOutput) {
    throw RangeError('Cannot debug output with multiple entry points')
  }

  const globalIifePath = './dist/global.min.js'
  console.log(`Size of ${globalIifePath} ...`)
  await execLive([
    'gzip-size',
    '--include-original',
    ...(rawSizes ? ['--raw'] : []),
    globalIifePath,
  ])
  console.log()

  for (const entryPoint of entryPoints) {
    await execLive([
      'export-size',
      '--bundler',
      'rollup',
      '--compression',
      'gzip',
      ...(debugOutput ? ['--output'] : []),
      ...(rawSizes ? ['--raw'] : []),
      './dist' + (entryPoint === '.' ? '' : `:${entryPoint}`),
    ])
  }
}
