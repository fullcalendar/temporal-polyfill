import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runCli } from '../cli.js'

const tempDirs: string[] = []

describe('CLI', () => {
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('writes safe transforms and prints the TypeScript note for changed TS files', async () => {
    const filePath = tempFile(
      'input.ts',
      `
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'

const date = PlainDateFns.create(2024, 5, 1)
`,
    )
    const output = captureOutput()

    const exitCode = await runCli(['fns-to-temporal', filePath], output.io)

    expect(exitCode).toBe(0)
    expect(readFileSync(filePath, 'utf8')).toContain(
      'const date = new Temporal.PlainDate(2024, 5, 1)',
    )
    expect(output.stdout()).toContain('changed 1 file(s), unchanged 0 file(s)')
    expect(output.stdout()).toContain('TypeScript note:')
  })

  it('prints help and version', async () => {
    const helpOutput = captureOutput()
    const versionOutput = captureOutput()

    const helpExitCode = await runCli(['--help'], helpOutput.io)
    const versionExitCode = await runCli(['--version'], versionOutput.io)

    expect(helpExitCode).toBe(0)
    expect(versionExitCode).toBe(0)
    expect(helpOutput.stdout()).toContain(
      'temporal-polyfill-codemod fns-to-temporal <path...> [options]',
    )
    expect(versionOutput.stdout()).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('prints dry-run output without writing files', async () => {
    const source = `
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'

const date = PlainDateFns.create(2024, 5, 1)
`
    const filePath = tempFile('input.js', source)
    const output = captureOutput()

    const exitCode = await runCli(
      ['fns-to-temporal', filePath, '--dry', '--print'],
      output.io,
    )

    expect(exitCode).toBe(0)
    expect(readFileSync(filePath, 'utf8')).toBe(source)
    expect(output.stdout()).toContain(`--- ${filePath}`)
    expect(output.stdout()).toContain(
      'const date = new Temporal.PlainDate(2024, 5, 1)',
    )
    expect(output.stdout()).not.toContain('TypeScript note:')
  })

  it('returns nonzero on warnings unless warnings are allowed', async () => {
    const filePath = tempFile(
      'input.ts',
      `
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'

const predicate = PlainDateFns.isRecord
`,
    )
    const defaultOutput = captureOutput()
    const allowedOutput = captureOutput()

    const defaultExitCode = await runCli(
      ['fns-to-temporal', filePath],
      defaultOutput.io,
    )
    const allowedExitCode = await runCli(
      ['fns-to-temporal', filePath, '--allow-warnings'],
      allowedOutput.io,
    )

    expect(defaultExitCode).toBe(1)
    expect(allowedExitCode).toBe(0)
    expect(defaultOutput.stdout()).toContain('warning(s)')
    expect(defaultOutput.stdout()).toContain(
      'Untransformed PlainDateFns.isRecord usage',
    )
  })

  it('prints the temporal-utils note when type rewrites introduce temporal-utils imports', async () => {
    const filePath = tempFile(
      'input.ts',
      `
import type { RoundingMode } from 'temporal-polyfill/fns'

type Mode = RoundingMode
`,
    )
    const output = captureOutput()

    const exitCode = await runCli(['fns-to-temporal', filePath], output.io)

    expect(exitCode).toBe(0)
    expect(readFileSync(filePath, 'utf8')).toContain(
      "import type { RoundingMode } from 'temporal-utils'",
    )
    expect(output.stdout()).toContain(
      'This migration introduced imports from temporal-utils.',
    )
  })

  it('reports parser errors per file and keeps processing remaining files', async () => {
    const goodPath = tempFile(
      'good.ts',
      `
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'

const date = PlainDateFns.create(2024, 5, 1)
`,
    )
    const badPath = tempFile(
      'bad.ts',
      `
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'

const date =
`,
    )
    const output = captureOutput()

    const exitCode = await runCli(
      ['fns-to-temporal', badPath, goodPath],
      output.io,
    )

    expect(exitCode).toBe(1)
    expect(readFileSync(goodPath, 'utf8')).toContain(
      'const date = new Temporal.PlainDate(2024, 5, 1)',
    )
    expect(output.stdout()).toContain('error files 1')
    expect(output.stdout()).toContain(`${badPath}\n  error:`)
  })
})

function tempFile(fileName: string, content: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'temporal-codemod-'))
  tempDirs.push(dir)
  const filePath = join(dir, fileName)
  writeFileSync(filePath, content)
  return filePath
}

function captureOutput(): {
  io: {
    stdout(text: string): void
    stderr(text: string): void
  }
  stdout(): string
  stderr(): string
} {
  const stdout: string[] = []
  const stderr: string[] = []

  return {
    io: {
      stdout(text) {
        stdout.push(text)
      },
      stderr(text) {
        stderr.push(text)
      },
    },
    stdout() {
      return stdout.join('\n')
    },
    stderr() {
      return stderr.join('\n')
    },
  }
}
