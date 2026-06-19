#!/usr/bin/env node

import { statSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import {
  join as joinPaths,
  relative as relativePath,
  resolve as resolvePath,
  sep as pathSep,
} from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = fileURLToPath(new URL('.', import.meta.url))
const pkgDir = joinPaths(currentDir, '..')
const pkgJson = JSON.parse(
  await readFile(joinPaths(pkgDir, 'package.json'), 'utf8'),
)
const srcReadme = await readFile(joinPaths(pkgDir, 'README.md'), 'utf8')

const repoUrl = pkgJson.repository.url.replace(/\.git$/, '')
const packageDir = pkgJson.repository.directory || ''
// The repo root on disk: climb out of the package's subdirectory (one ".." per
// path segment in repository.directory), so we can compute repo-relative paths.
const repoRootDir = packageDir
  ? resolvePath(pkgDir, ...packageDir.split('/').map(() => '..'))
  : pkgDir

await mkdir(joinPaths(pkgDir, 'dist'), { recursive: true })
await writeFile(
  joinPaths(pkgDir, 'dist/README.md'),
  rewriteRelativeLinks(srcReadme),
)

// NPM renders the generated README outside the repo, so local package links need
// to point back to GitHub while same-document anchors keep working normally.
function rewriteRelativeLinks(markdown) {
  return markdown
    .replace(/(!?\[[^\]]*\]\()([^)\s]+)(\))/g, (match, open, url, close) => {
      const rewritten = toGithubUrl(url)
      return rewritten ? open + rewritten + close : match
    })
    .replace(/\bhref=(['"])([^'"]+)\1/g, (match, quote, url) => {
      const rewritten = toGithubUrl(url)
      return rewritten ? `href=${quote}${rewritten}${quote}` : match
    })
}

// Convert a repo-relative link into an absolute GitHub URL, choosing /blob/ for
// files and /tree/ for directories (GitHub's two distinct path styles). Returns
// null for links we should leave untouched (anchors, absolute/protocol URLs).
function toGithubUrl(url) {
  if (!isRelativeRepoLink(url)) {
    return null
  }

  // Split off any #fragment or ?query so we can stat the bare path, then
  // re-append it to the rewritten URL.
  const suffixMatch = url.match(/[#?].*$/)
  const suffix = suffixMatch ? suffixMatch[0] : ''
  const pathPart = suffix ? url.slice(0, url.length - suffix.length) : url

  const localPath = resolvePath(pkgDir, pathPart)
  const repoRelPath = relativePath(repoRootDir, localPath)
    .split(pathSep)
    .join('/')
  const kind = resolveLinkKind(localPath)

  return `${repoUrl}/${kind}/main/${repoRelPath}${suffix}`
}

// "tree" for directories, "blob" for files. If the target is missing, assume a
// file but warn — a broken relative link is almost always a typo worth catching.
function resolveLinkKind(localPath) {
  try {
    return statSync(localPath).isDirectory() ? 'tree' : 'blob'
  } catch {
    console.warn(
      `readme.js: link target not found, assuming file: ${localPath}`,
    )
    return 'blob'
  }
}

function isRelativeRepoLink(url) {
  return (
    !url.startsWith('#') &&
    !url.startsWith('//') &&
    !/^[a-z][a-z0-9+.-]*:/i.test(url)
  )
}
