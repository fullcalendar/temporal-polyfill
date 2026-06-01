#!/usr/bin/env node

import { getExportsSize, readableSize } from 'export-size'
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

  const includedDependencies = await readPackageDependencyNames(
    './dist/package.json',
  )

  for (const entryPoint of entryPoints) {
    await displayExportSize(
      './dist' + (entryPoint === '.' ? '' : `:${entryPoint}`),
      debugOutput,
      rawSizes,
      includedDependencies,
    )
  }
}

async function readPackageDependencyNames(pkgJsonPath) {
  const pkgJson = JSON.parse(await readFile(pkgJsonPath))
  return [
    ...new Set([
      ...Object.keys(pkgJson.dependencies || {}),
      ...Object.keys(pkgJson.peerDependencies || {}),
      ...Object.keys(pkgJson.optionalDependencies || {}),
      ...Object.keys(pkgJson.devDependencies || {}),
    ]),
  ]
}

async function displayExportSize(
  pkg,
  debugOutput,
  rawSizes,
  includedDependencies,
) {
  const progress = createProgressReporter()
  const { exports, packageJSON, meta } = await getExportsSize({
    pkg,
    includes: includedDependencies,
    output: debugOutput,
    bundler: 'rollup',
    compression: 'gzip',
    reporter: progress.update,
  }).finally(() => {
    progress.stop()
  })

  for (const [name, version] of Object.entries(meta.versions)) {
    console.log(`${name.padEnd(15)}v${version.replace(/^\^/, '')}`)
  }

  console.log()
  console.log(`${meta.name} v${packageJSON.version}`)
  console.log()

  const tableRows = exports.map(({ name, minzipped }) => [
    name,
    rawSizes ? String(minzipped) : readableSize(minzipped),
  ])
  const nameColumnWidth = Math.max(
    'export'.length,
    ...tableRows.map(([name]) => name.length),
  )
  const sizeColumnWidth = Math.max(
    'min+gzip'.length,
    ...tableRows.map(([, displaySize]) => displaySize.length),
  )

  console.log(
    `${'export'.padEnd(nameColumnWidth)} ${'min+gzip'.padStart(
      sizeColumnWidth,
    )}`,
  )
  console.log(`${'-'.repeat(nameColumnWidth)} ${'-'.repeat(sizeColumnWidth)}`)

  for (const [name, displaySize] of tableRows) {
    console.log(
      `${name.padEnd(nameColumnWidth)} ${displaySize.padStart(
        sizeColumnWidth,
      )}`,
    )
  }

  console.log()
}

function createProgressReporter() {
  let showing = false

  return {
    update(name, value, total) {
      if (!process.stdout.isTTY) {
        return
      }

      const width = 40
      const filled = total ? Math.round((value / total) * width) : 0
      const bar = `${'#'.repeat(filled)}${'-'.repeat(width - filled)}`

      if (!showing) {
        process.stdout.write('\x1B[?25l')
        showing = true
      }

      process.stdout.write(`\r${bar} ${value}/${total} ${name}`)
    },
    stop() {
      if (!showing) {
        return
      }

      process.stdout.write(`\r${' '.repeat(process.stdout.columns || 80)}\r`)
      process.stdout.write('\x1B[?25h')
      showing = false
    },
  }
}
