#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const placeholder = '{VERSION}'
const pkgDir = dirname(dirname(fileURLToPath(import.meta.url)))
const pkgJson = JSON.parse(await readFile(join(pkgDir, 'package.json'), 'utf8'))
const srcReadme = await readFile(join(pkgDir, 'README.md'), 'utf8')

if (!srcReadme.includes(placeholder)) {
  throw new Error(`README.md must contain ${placeholder}`)
}

await mkdir(join(pkgDir, 'dist'), { recursive: true })
await writeFile(
  join(pkgDir, 'dist/README.md'),
  srcReadme.replaceAll(placeholder, pkgJson.version),
)
