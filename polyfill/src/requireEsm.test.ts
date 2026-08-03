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
