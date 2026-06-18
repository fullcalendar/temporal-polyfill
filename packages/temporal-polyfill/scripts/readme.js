#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const placeholder = '{VERSION}'
const githubBranchUrl =
  'https://github.com/fullcalendar/temporal-polyfill/tree/main/'
const githubReadmeDirUrl = `${githubBranchUrl}packages/temporal-polyfill/`
const pkgDir = dirname(dirname(fileURLToPath(import.meta.url)))
const pkgJson = JSON.parse(await readFile(join(pkgDir, 'package.json'), 'utf8'))
const srcReadme = await readFile(join(pkgDir, 'README.md'), 'utf8')

if (!srcReadme.includes(placeholder)) {
  throw new Error(`README.md must contain ${placeholder}`)
}

await mkdir(join(pkgDir, 'dist'), { recursive: true })
await writeFile(
  join(pkgDir, 'dist/README.md'),
  rewriteRelativeLinks(srcReadme.replaceAll(placeholder, pkgJson.version)),
)

// NPM renders the generated README outside the repo, so local package links need
// to point back to GitHub while same-document anchors keep working normally.
function rewriteRelativeLinks(markdown) {
  return markdown.replace(
    /(!?\[[^\]]*\]\()([^)\s]+)(\))/g,
    (match, open, url, close) => {
      if (isRelativeRepoLink(url)) {
        return open + new URL(url, githubReadmeDirUrl).href + close
      }

      return match
    },
  )
}

function isRelativeRepoLink(url) {
  return (
    !url.startsWith('#') &&
    !url.startsWith('//') &&
    !/^[a-z][a-z0-9+.-]*:/i.test(url)
  )
}
