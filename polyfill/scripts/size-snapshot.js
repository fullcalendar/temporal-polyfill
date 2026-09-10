#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { gzipSync } from 'node:zlib'

const { values } = parseArgs({
  options: {
    output: { type: 'string' },
    input: { type: 'string' },
    baseline: { type: 'string' },
    check: { type: 'boolean', default: false },
    tolerance: { type: 'string', default: '0' },
  },
})
const tolerance = Number(values.tolerance)
if (
  (!values.output && !values.input) ||
  !Number.isFinite(tolerance) ||
  tolerance < 0
) {
  throw new Error(
    'Provide --output (or --input) and a nonnegative byte --tolerance',
  )
}
if (values.check && !values.baseline) {
  throw new Error('--check requires --baseline')
}

const baseline = values.baseline
  ? (await readSnapshot(values.baseline)).sizes
  : undefined
const snapshot = values.input
  ? await readSnapshot(values.input)
  : await measureSizes()
if (values.output) {
  await writeFile(values.output, JSON.stringify(snapshot, null, 2) + '\n')
}

console.log('Minified + gzip bytes; percentages are relative to Baseline.\n')
let failed = false
console.log('| Entry | ' + (baseline ? 'Baseline | ' : '') + 'Current |')
console.log('| --- | ' + (baseline ? '---: | ' : '') + '---: |')
for (const name of new Set([
  ...Object.keys(snapshot.sizes),
  ...Object.keys(baseline || {}),
])) {
  const current = snapshot.sizes[name]
  const previous = baseline?.[name]
  const delta = current - previous
  const display = current === undefined ? 'removed' : String(current)
  if (baseline) {
    const change =
      current === undefined
        ? 'removed'
        : previous === undefined
          ? 'new'
          : `${delta >= 0 ? '+' : ''}${((delta / previous) * 100).toFixed(1)}%`
    console.log(
      `| ${name} | ${
        previous === undefined ? 'missing' : previous + ' (—)'
      } | ${display} (${change}) |`,
    )
    // A display threshold must never suppress the gate: check every export and
    // require explicit review when the public export set changes.
    if (current === undefined || previous === undefined || delta > tolerance) {
      failed = true
    }
  } else {
    console.log(`| ${name} | ${display} |`)
  }
}
if (values.check && failed) {
  console.error(
    `Size regression or changed exports (tolerance: ${tolerance} bytes)`,
  )
  process.exitCode = 1
}

// Validate cached inputs before measuring: malformed baselines must fail closed.
async function readSnapshot(path) {
  const snapshot = JSON.parse(await readFile(path, 'utf8'))
  if (
    !snapshot.sizes ||
    !snapshot.sizes['global/basic'] ||
    !snapshot.sizes['global/full'] ||
    Object.values(snapshot.sizes).some(
      (size) => !Number.isSafeInteger(size) || size <= 0,
    )
  ) {
    throw new Error('Invalid size snapshot: ' + path)
  }
  return snapshot
}

// Capture the shipping dual native/shim exports, including runtime dependencies.
// Build and minify first: measuring stale dist files would hide regressions.
async function measureSizes() {
  const { getExportsSize } = await import('export-size')
  const pkg = JSON.parse(await readFile('./package.json', 'utf8'))
  const distPkg = JSON.parse(await readFile('./dist/package.json', 'utf8'))
  const includes = [
    ...new Set(
      [
        'dependencies',
        'peerDependencies',
        'optionalDependencies',
        'devDependencies',
      ].flatMap((key) => Object.keys(distPkg[key] || {})),
    ),
  ]
  const snapshot = {
    node: process.version,
    zlib: process.versions.zlib,
    sizes: {},
  }
  for (const [name, path] of [
    ['global/basic', './dist/.global.min.js'],
    ['global/full', './dist/full/.global.min.js'],
  ]) {
    // Match the existing size CLI: globals use level 9; exports use default gzip.
    snapshot.sizes[name] = gzipSync(await readFile(path), { level: 9 }).length
  }
  for (const entry of Object.keys(pkg.buildConfig.exports)) {
    if (!entry.startsWith('./fns/')) {
      continue
    }
    const { exports } = await getExportsSize({
      pkg: './dist:' + entry.slice(2),
      includes,
      output: false,
      bundler: 'rollup',
      compression: 'gzip',
    })
    if (!exports.length) {
      throw new Error('No runtime exports found for ' + entry)
    }
    for (const { name, minzipped } of exports.sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      snapshot.sizes[entry.slice(2) + '.' + name] = minzipped
    }
    console.error(`Measured ${entry}: ${exports.length} exports`)
  }
  return snapshot
}
