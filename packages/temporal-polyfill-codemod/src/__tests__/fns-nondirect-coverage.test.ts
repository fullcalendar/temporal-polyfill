import { describe, expect, it } from 'vitest'
import { fnsApiCoverage } from '../fns-api-coverage.js'
import { transformSource } from '../index.js'

const receiverByType: Record<string, string> = {
  Instant: 'instant',
  ZonedDateTime: 'zdt',
  PlainDateTime: 'dateTime',
  PlainDate: 'date',
  PlainTime: 'time',
  PlainYearMonth: 'yearMonth',
  PlainMonthDay: 'monthDay',
  Duration: 'duration',
}

const otherByType: Record<string, string> = {
  Instant: 'otherInstant',
  ZonedDateTime: 'otherZdt',
  PlainDateTime: 'otherDateTime',
  PlainDate: 'otherDate',
  PlainTime: 'otherTime',
  PlainYearMonth: 'otherYearMonth',
}

describe('non-direct fns API mappings', () => {
  for (const [helperName, status] of Object.entries(fnsApiCoverage.Calendar)) {
    if (status !== 'contextual-calendar') {
      continue
    }

    it(`warns for standalone Calendar.${helperName}`, () => {
      const source = `
import * as CalendarFns from 'temporal-polyfill/fns/Calendar'

const result = CalendarFns.${helperName}(${calendarArgs(helperName)})
`
      const result = transformSource(source, { path: 'input.ts' })

      expect(result.diagnostics.length, helperName).toBeGreaterThan(0)
      expect(result.code, helperName).toContain(
        'temporal-polyfill/fns/Calendar',
      )
    })

    it(`rewrites Calendar.${helperName} in a known calendar slot`, () => {
      const source = `
import * as CalendarFns from 'temporal-polyfill/fns/Calendar'
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'

const result = PlainDateFns.create(2024, 5, 1, CalendarFns.${helperName}(${calendarArgs(
        helperName,
      )}))
`
      const result = transformSource(source, { path: 'input.ts' })

      expect(result.diagnostics, helperName).toEqual([])
      expect(result.code, helperName).not.toContain('temporal-polyfill/fns')
    })
  }

  for (const [typeName, helpers] of Object.entries(fnsApiCoverage)) {
    if (typeName === 'Calendar') {
      continue
    }

    for (const [helperName, status] of Object.entries(helpers)) {
      if (status === 'temporal-utils') {
        const source = `
import * as ${typeName}Fns from 'temporal-polyfill/fns/${typeName}'

const result = ${typeName}Fns.${helperName}(${nonDirectArgs(
          typeName,
          helperName,
        )})
`
        it(`rewrites temporal-utils helper ${typeName}.${helperName}`, () => {
          const result = transformSource(source, { path: 'input.ts' })

          expect(result.diagnostics, `${typeName}.${helperName}`).toEqual([])
          expect(result.needsTemporalUtils, `${typeName}.${helperName}`).toBe(
            true,
          )
          expect(result.code, `${typeName}.${helperName}`).toContain(
            `import { ${helperName} } from 'temporal-utils'`,
          )
          expect(result.code, `${typeName}.${helperName}`).not.toContain(
            `temporal-polyfill/fns/${typeName}`,
          )
        })
        continue
      }

      if (status === 'diagnostic-only') {
        it(`warns for diagnostic-only helper ${typeName}.${helperName}`, () => {
          const source = `
import * as ${typeName}Fns from 'temporal-polyfill/fns/${typeName}'

const result = ${typeName}Fns.${helperName}(${nonDirectArgs(
            typeName,
            helperName,
          )})
`
          const result = transformSource(source, { path: 'input.ts' })

          expect(
            result.diagnostics.length,
            `${typeName}.${helperName}`,
          ).toBeGreaterThan(0)
          expect(result.code, `${typeName}.${helperName}`).toContain(
            `temporal-polyfill/fns/${typeName}`,
          )
        })
      }
    }
  }
})

function calendarArgs(helperName: string): string {
  return helperName === 'getBasic' ||
    helperName === 'getAny' ||
    helperName === 'getExotic'
    ? "'buddhist'"
    : ''
}

function nonDirectArgs(typeName: string, helperName: string): string {
  const receiver = receiverByType[typeName]
  const other = otherByType[typeName]

  if (helperName.startsWith('diff')) {
    return `${receiver}, ${other}, options`
  }

  if (helperName.startsWith('roundTo')) {
    return `${receiver}, options`
  }

  if (helperName.startsWith('startOf') || helperName.startsWith('endOf')) {
    return receiver
  }

  if (helperName.startsWith('withDayOf')) {
    return `${receiver}, 1`
  }

  if (helperName === 'withWeekOfYear') {
    return `${receiver}, 1`
  }

  if (helperName === 'toBasicString') {
    return `${receiver}, options`
  }

  if (helperName === 'createFormat') {
    return "'en-US', options"
  }

  throw new Error(`Missing non-direct fixture for ${typeName}.${helperName}`)
}
