import { execFileSync } from 'node:child_process'
import { resolve as resolvePath } from 'node:path'
import { describe, expect, it } from 'vitest'

const canRequireEsm = Reflect.get(process.features, 'require_module') === true
const describeRequireEsm = canRequireEsm ? describe : describe.skip

describeRequireEsm('require(esm)', () => {
  it('loads the published ESM package from CommonJS', () => {
    // Vitest transforms modules through its own loader. Running a child from
    // dist exercises Node's native package self-reference and export map.
    const output = execFileSync(
      process.execPath,
      [
        '--input-type=commonjs',
        '--eval',
        `
          const assert = require('node:assert/strict')
          const { Temporal } = require('temporal-polyfill')
          const instant = Temporal.Now.instant()

          assert(instant instanceof Temporal.Instant)
          process.stdout.write('loaded')
        `,
      ],
      {
        cwd: resolvePath(process.cwd(), 'dist'),
        encoding: 'utf8',
      },
    )

    expect(output).toBe('loaded')
  })
})

// The ./global and ./full/global entrypoints ship a separate IIFE/CJS build
// (global.cjs / full/global.cjs) and expose it via the "require" export condition.
// This means require('temporal-polyfill/global') must work on ALL Node versions,
// not just Node 22+ where require(esm) was introduced — because the "require"
// condition resolves to the IIFE artifact, not the ESM one.
//
// We pass --no-experimental-require-module explicitly so that Node 22+ doesn't
// silently fall back to loading the ESM bundle via require(esm), which would
// mask a missing "require" condition and hide regressions in CI.
const noRequireEsmFlag = '--no-experimental-require-module'

// Only pass the flag on Node versions that support it (introduced in v22).
// On older Node the flag is unrecognised and would crash the child process.
const nodeMajor = parseInt(process.versions.node.split('.')[0], 10)
const strictCjsFlags = nodeMajor >= 22 ? [noRequireEsmFlag] : []

describe('require(global)', () => {
  it('loads temporal-polyfill/global from CommonJS without ERR_REQUIRE_ESM', () => {
    const output = execFileSync(
      process.execPath,
      [
        ...strictCjsFlags,
        '--input-type=commonjs',
        '--eval',
        `
          require('temporal-polyfill/global')
          const assert = require('node:assert/strict')

          // The global polyfill installs Temporal on globalThis.
          assert(typeof globalThis.Temporal !== 'undefined', 'Temporal not installed')
          assert(typeof globalThis.Temporal.Now.instant === 'function')
          process.stdout.write('loaded')
        `,
      ],
      {
        cwd: resolvePath(process.cwd(), 'dist'),
        encoding: 'utf8',
      },
    )

    expect(output).toBe('loaded')
  })

  it('loads temporal-polyfill/full/global from CommonJS without ERR_REQUIRE_ESM', () => {
    const output = execFileSync(
      process.execPath,
      [
        ...strictCjsFlags,
        '--input-type=commonjs',
        '--eval',
        `
          require('temporal-polyfill/full/global')
          const assert = require('node:assert/strict')

          assert(typeof globalThis.Temporal !== 'undefined', 'Temporal not installed')
          assert(typeof globalThis.Temporal.Now.instant === 'function')
          process.stdout.write('loaded')
        `,
      ],
      {
        cwd: resolvePath(process.cwd(), 'dist'),
        encoding: 'utf8',
      },
    )

    expect(output).toBe('loaded')
  })
})
