import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { transformSource } from '../index.js'

const fixturesDir = join('src', '__tests__', 'fixtures')

describe('fixtures', () => {
  it.each([
    'comment-preservation',
    'mixed-imports-and-aliases',
    'dogfood-named-imports',
    'dogfood-type-and-value-imports',
    'dogfood-existing-temporal-utils',
    'dogfood-collisions',
    'dogfood-warnings',
  ])('matches %s output and is idempotent', (fixtureName) => {
    const inputPath = join(fixturesDir, `${fixtureName}.input.txt`)
    const outputPath = join(fixturesDir, `${fixtureName}.output.txt`)
    const input = readFileSync(inputPath, 'utf8')
    const expectedOutput = readFileSync(outputPath, 'utf8')
    const transformPath = `${fixtureName}.ts`

    const firstResult = transformSource(input, { path: transformPath })
    const secondResult = transformSource(firstResult.code, {
      path: transformPath,
    })

    expect(firstResult.code).toBe(expectedOutput)
    expect(secondResult.code).toBe(expectedOutput)
    expect(secondResult.changed).toBe(false)
  })

  it('rewrites mixed imports with aliases through direct and temporal-utils targets', () => {
    const inputPath = join(fixturesDir, 'mixed-imports-and-aliases.input.txt')
    const input = readFileSync(inputPath, 'utf8')

    const result = transformSource(input, {
      path: 'mixed-imports-and-aliases.ts',
    })

    expect(result.diagnostics).toEqual([])
    expect(result.needsTemporalUtils).toBe(true)
    expect(result.code).toContain("from 'temporal-utils'")
    expect(result.code).not.toContain('temporal-polyfill/fns')
  })

  it('keeps warning-heavy dogfood diagnostics stable', () => {
    const inputPath = join(fixturesDir, 'dogfood-warnings.input.txt')
    const input = readFileSync(inputPath, 'utf8')

    const result = transformSource(input, {
      path: 'dogfood-warnings.ts',
    })

    expect(result.diagnostics.map((diagnostic) => diagnostic.message)).toEqual([
      'PlainDate createFormat is not implemented by the codemod yet',
      'ZonedDateTime roundToHour options object already has smallestUnit; manual review needed',
      'Untransformed CalendarFns.getBuddhist usage',
      'Untransformed PlainDateFns.isRecord usage',
      'Untransformed dynamic PlainDateFns usage',
      'Untransformed PlainDateFns.createFormat usage',
      'Untransformed ZonedDateTimeFns.roundToHour usage',
    ])
  })

  it('parses TSX files while rewriting fns calls', () => {
    const input = `
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'

export function DateCell(props: { date: Temporal.PlainDate }) {
  const next = PlainDateFns.addDays(props.date, 1)
  return <time dateTime={PlainDateFns.toString(next)}>{PlainDateFns.day(next)}</time>
}
`

    const result = transformSource(input, { path: 'date-cell.tsx' })

    expect(result.diagnostics).toEqual([])
    expect(result.code).toContain('const next = props.date.add({')
    expect(result.code).toContain('days: 1')
    expect(result.code).toContain('dateTime={next.toString()}')
    expect(result.code).toContain('{next.day}</time>')
    expect(result.code).not.toContain('temporal-polyfill/fns')
  })
})
