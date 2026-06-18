#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'
import { join as joinPaths } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = fileURLToPath(new URL('.', import.meta.url))
const pkgDir = joinPaths(currentDir, '..')
const readmePath = joinPaths(pkgDir, 'README.md')
const packageJsonPath = joinPaths(pkgDir, 'package.json')
const pkgJson = JSON.parse(await readFile(packageJsonPath, 'utf8'))
const srcReadme = await readFile(readmePath, 'utf8')

const args = process.argv.slice(2)
const fix = args.includes('fix') || args.includes('--fix')
const mismatches = []

// Match jsDelivr npm URLs for both unscoped packages (`pkg@1.2.3`) and scoped
// packages (`@scope/pkg@1.2.3`). The version is intentionally required here:
// this lint exists to keep pinned CDN examples synchronized with package.json.
const jsdelivrNpmUrl =
  /https:\/\/cdn\.jsdelivr\.net\/npm\/((?:@[^/@\s'")]+\/)?[^/@\s'")]+)@([^/?#\s'")]+)(?=$|[/?#\s'")])/g

const fixedReadme = srcReadme.replace(
  jsdelivrNpmUrl,
  (url, packageName, requestedVersion, offset) => {
    if (packageName === pkgJson.name && requestedVersion !== pkgJson.version) {
      mismatches.push({ url, requestedVersion, offset })

      if (fix) {
        return url.replace(
          `${packageName}@${requestedVersion}`,
          `${packageName}@${pkgJson.version}`,
        )
      }
    }

    return url
  },
)

if (fix && fixedReadme !== srcReadme) {
  await writeFile(readmePath, fixedReadme)
}

if (mismatches.length) {
  const action = fix ? 'Updated' : 'Found'

  console.error(
    `${action} ${mismatches.length} README jsDelivr version mismatch${
      mismatches.length === 1 ? '' : 'es'
    } for ${pkgJson.name}; expected ${pkgJson.version}.`,
  )

  for (const mismatch of mismatches) {
    console.error(
      `- ${mismatch.requestedVersion} at README.md:${getLineNumber(
        srcReadme,
        mismatch.offset,
      )}`,
    )
  }

  if (!fix) {
    console.error('Run `pnpm run lint:readme:fix` to update README.md.')
    process.exitCode = 1
  }
}

function getLineNumber(text, offset) {
  return text.slice(0, offset).split('\n').length
}
