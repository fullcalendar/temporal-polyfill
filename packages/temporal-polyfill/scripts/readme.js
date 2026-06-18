#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join as joinPaths } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = fileURLToPath(new URL('.', import.meta.url))
const pkgDir = joinPaths(currentDir, '..')
const pkgJson = JSON.parse(
  await readFile(joinPaths(pkgDir, 'package.json'), 'utf8'),
)
const srcReadme = await readFile(joinPaths(pkgDir, 'README.md'), 'utf8')

const githubReadmeDirUrl = getGithubReadmeDirUrl(pkgJson)

await mkdir(joinPaths(pkgDir, 'dist'), { recursive: true })
await writeFile(
  joinPaths(pkgDir, 'dist/README.md'),
  rewriteRelativeLinks(srcReadme),
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

function getGithubReadmeDirUrl(pkgJson) {
  const repoUrl = pkgJson.repository.url.replace(/\.git$/, '')
  const packageDir = pkgJson.repository.directory || ''
  const packagePath = packageDir ? `${packageDir}/` : ''

  return `${repoUrl}/tree/main/${packagePath}`
}
