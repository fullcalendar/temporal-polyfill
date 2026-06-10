import { spawnSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const tempDirs: string[] = []
const cliPath = resolve('dist/cli.js')

describe('built CLI smoke tests', () => {
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('preserves the executable shebang and supports help/version', () => {
    expect(
      readFileSync(cliPath, 'utf8').startsWith('#!/usr/bin/env node'),
    ).toBe(true)

    const helpResult = runBuiltCli('--help')
    const versionResult = runBuiltCli('--version')

    expect(helpResult.status).toBe(0)
    expect(helpResult.stdout).toContain('Usage:')
    expect(versionResult.status).toBe(0)
    expect(versionResult.stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('runs the built CLI in dry print mode', () => {
    const filePath = tempFile(
      'input.ts',
      `
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'

const date = PlainDateFns.create(2024, 5, 1)
`,
    )

    const result = runBuiltCli('fns-to-temporal', filePath, '--dry', '--print')

    expect(result.status).toBe(0)
    expect(result.stdout).toContain(`--- ${filePath}`)
    expect(result.stdout).toContain(
      'const date = new Temporal.PlainDate(2024, 5, 1)',
    )
    expect(readFileSync(filePath, 'utf8')).toContain('PlainDateFns.create')
  })

  it('writes transforms through the built CLI', () => {
    const filePath = tempFile(
      'input.js',
      `
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'

const date = PlainDateFns.create(2024, 5, 1)
`,
    )

    const result = runBuiltCli('fns-to-temporal', filePath)

    expect(result.status).toBe(0)
    expect(readFileSync(filePath, 'utf8')).toContain(
      'const date = new Temporal.PlainDate(2024, 5, 1)',
    )
    expect(readFileSync(filePath, 'utf8')).not.toContain(
      'temporal-polyfill/fns',
    )
  })

  it('preserves warning exit behavior through the built CLI', () => {
    const filePath = tempFile(
      'input.ts',
      `
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'

const result = PlainDateFns.createFormat('en-US')
`,
    )

    const defaultResult = runBuiltCli('fns-to-temporal', filePath)
    const allowedResult = runBuiltCli(
      'fns-to-temporal',
      filePath,
      '--allow-warnings',
    )

    expect(defaultResult.status).toBe(1)
    expect(allowedResult.status).toBe(0)
    expect(defaultResult.stdout).toContain(
      'PlainDate createFormat is not implemented by the codemod yet',
    )
  })

  it('walks directories and ignores node_modules and dist', () => {
    const dir = tempDir()
    const srcPath = join(dir, 'src', 'input.ts')
    const nodeModulesPath = join(dir, 'node_modules', 'input.ts')
    const distPath = join(dir, 'dist', 'input.ts')

    writeFixture(srcPath)
    writeFixture(nodeModulesPath)
    writeFixture(distPath)

    const result = runBuiltCli('fns-to-temporal', dir)

    expect(result.status).toBe(0)
    expect(readFileSync(srcPath, 'utf8')).toContain(
      'new Temporal.PlainDate(2024, 5, 1)',
    )
    expect(readFileSync(nodeModulesPath, 'utf8')).toContain(
      'PlainDateFns.create',
    )
    expect(readFileSync(distPath, 'utf8')).toContain('PlainDateFns.create')
  })
})

function runBuiltCli(...args: string[]): {
  status: number | null
  stdout: string
  stderr: string
} {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    encoding: 'utf8',
    cwd: resolve('.'),
  })

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  }
}

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'temporal-codemod-smoke-'))
  tempDirs.push(dir)
  return dir
}

function tempFile(fileName: string, content: string): string {
  const dir = tempDir()
  const filePath = join(dir, fileName)
  mkdirSync(join(filePath, '..'), { recursive: true })
  writeFileSync(filePath, content)
  return filePath
}

function writeFixture(filePath: string): void {
  mkdirSync(join(filePath, '..'), { recursive: true })
  writeFileSync(
    filePath,
    `
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'

const date = PlainDateFns.create(2024, 5, 1)
`,
  )
}
