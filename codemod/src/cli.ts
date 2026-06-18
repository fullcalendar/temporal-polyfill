#!/usr/bin/env node

import { readdirSync, realpathSync } from 'node:fs'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  type Diagnostic,
  type TransformResult,
  transformSource,
} from './index.js'

interface CliOptions {
  transformName: string
  paths: string[]
  dry: boolean
  print: boolean
  allowWarnings: boolean
  help: boolean
  version: boolean
}

interface CliIo {
  stdout(text: string): void
  stderr(text: string): void
}

const supportedExtensions = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
  '.mts',
  '.cts',
])

const require = createRequire(import.meta.url)
const packageJson = require('../package.json') as { version: string }

export async function runCli(
  argv: string[],
  io: CliIo = {
    stdout: console.log,
    stderr: console.error,
  },
): Promise<number> {
  const options = parseArgs(argv)
  if (options.version) {
    io.stdout(packageJson.version)
    return 0
  }
  if (options.help) {
    io.stdout(helpText())
    return 0
  }
  if (options.transformName !== 'fns-to-temporal') {
    throw new Error(`Unknown transform: ${options.transformName}`)
  }
  if (options.paths.length === 0) {
    throw new Error(
      'Usage: temporal-polyfill-codemod fns-to-temporal <path...> [--dry] [--print] [--allow-warnings]',
    )
  }

  const files = await collectFiles(options.paths)
  const summaries: string[] = []
  let changedCount = 0
  let unchangedCount = 0
  let warningFileCount = 0
  let errorFileCount = 0
  let diagnosticCount = 0
  let errorCount = 0
  let needsTemporalUtils = false
  let touchedTypeScript = false

  for (const filePath of files) {
    let source: string
    let result: TransformResult

    try {
      source = await readFile(filePath, 'utf8')
      result = transformSource(source, { path: filePath })
    } catch (error) {
      errorFileCount += 1
      errorCount += 1
      summaries.push(formatErrorSummary(filePath, error))
      continue
    }

    if (result.changed) {
      changedCount += 1
      if (!options.dry) {
        try {
          await writeFile(filePath, result.code)
        } catch (error) {
          errorFileCount += 1
          errorCount += 1
          summaries.push(formatErrorSummary(filePath, error))
          continue
        }
      }
    } else {
      unchangedCount += 1
    }

    if (options.print && result.changed) {
      io.stdout(`--- ${filePath}`)
      io.stdout(result.code)
    }

    needsTemporalUtils ||= result.needsTemporalUtils
    touchedTypeScript ||= result.touchedTypeScript && result.changed
    diagnosticCount += result.diagnostics.length
    if (result.diagnostics.length > 0) {
      warningFileCount += 1
    }
    summaries.push(formatFileSummary(filePath, result))
  }

  io.stdout(
    `fns-to-temporal: scanned ${files.length} file(s), changed ${changedCount} file(s), unchanged ${unchangedCount} file(s), warning files ${warningFileCount}, error files ${errorFileCount}, emitted ${diagnosticCount} warning(s), ${errorCount} error(s).`,
  )
  for (const summary of summaries) {
    if (summary !== '') {
      io.stdout(summary)
    }
  }

  if (needsTemporalUtils) {
    io.stdout('')
    io.stdout('This migration introduced imports from temporal-utils.')
    io.stdout('Install temporal-utils in the affected package(s).')
  }

  if (touchedTypeScript) {
    io.stdout('')
    io.stdout('TypeScript note:')
    io.stdout(
      'Rewritten TypeScript files now reference global Temporal types. If this project',
    )
    io.stdout(
      'does not already provide Temporal declarations, add them using your preferred',
    )
    io.stdout('type source.')
  }

  if (errorCount > 0 || (diagnosticCount > 0 && !options.allowWarnings)) {
    return 1
  }
  return 0
}

// pnpm workspace bins commonly execute through node_modules symlinks. Normalize
// both paths so the CLI still starts when Node resolves the module to its real
// package location.
if (
  process.argv[1] != null &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
) {
  runCli(process.argv.slice(2)).then(
    (exitCode) => {
      process.exit(exitCode)
    },
    (error) => {
      console.error(error instanceof Error ? error.message : String(error))
      process.exit(1)
    },
  )
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    transformName: '',
    paths: [],
    dry: false,
    print: false,
    allowWarnings: false,
    help: false,
    version: false,
  }

  for (const arg of args) {
    if (arg === '--dry' || arg === '--dry-run') {
      options.dry = true
    } else if (arg === '--print') {
      options.print = true
    } else if (arg === '--allow-warnings') {
      options.allowWarnings = true
    } else if (arg === '--help' || arg === '-h') {
      options.help = true
    } else if (arg === '--version' || arg === '-v') {
      options.version = true
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`)
    } else if (options.transformName === '') {
      options.transformName = arg
    } else {
      options.paths.push(arg)
    }
  }

  return options
}

function helpText(): string {
  return `Usage:
  temporal-polyfill-codemod fns-to-temporal <path...> [options]

Options:
  --dry, --dry-run      Print what would happen without writing files.
  --print               Print changed file contents.
  --allow-warnings      Exit 0 even when diagnostics are emitted.
  --help, -h            Show this help.
  --version, -v         Show the package version.

By default, diagnostics are printed and cause exit code 1 after all files are processed.`
}

async function collectFiles(paths: string[]): Promise<string[]> {
  const files: string[] = []
  for (const path of paths) {
    const stats = await stat(path)
    if (stats.isDirectory()) {
      collectFilesInDirectory(path, files)
    } else if (isSupportedFile(path)) {
      files.push(path)
    }
  }
  return files
}

function collectFilesInDirectory(dirPath: string, files: string[]): void {
  for (const dirent of readdirSync(dirPath, { withFileTypes: true })) {
    if (
      dirent.name === 'node_modules' ||
      dirent.name === 'dist' ||
      dirent.name.startsWith('.')
    ) {
      continue
    }

    const path = join(dirPath, dirent.name)
    if (dirent.isDirectory()) {
      collectFilesInDirectory(path, files)
    } else if (dirent.isFile() && isSupportedFile(path)) {
      files.push(path)
    }
  }
}

function isSupportedFile(path: string): boolean {
  for (const extension of supportedExtensions) {
    if (path.endsWith(extension)) {
      return true
    }
  }
  return false
}

function formatFileSummary(filePath: string, result: TransformResult): string {
  if (result.diagnostics.length === 0) {
    return ''
  }

  const lines = [`${filePath}`]
  for (const diagnostic of result.diagnostics) {
    lines.push(`  ${formatDiagnostic(diagnostic)}`)
  }
  return lines.join('\n')
}

function formatErrorSummary(filePath: string, error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return `${filePath}\n  error: ${message}`
}

function formatDiagnostic(diagnostic: Diagnostic): string {
  const location =
    diagnostic.line == null
      ? ''
      : `${diagnostic.line}:${diagnostic.column ?? 0} `
  return `${location}${diagnostic.kind}: ${diagnostic.message}`
}
