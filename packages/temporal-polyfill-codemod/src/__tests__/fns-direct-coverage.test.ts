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
  PlainMonthDay: 'otherMonthDay',
  Duration: 'otherDuration',
}

describe('direct fns API mappings', () => {
  for (const [typeName, helpers] of Object.entries(fnsApiCoverage)) {
    for (const [helperName, status] of Object.entries(helpers)) {
      if (status !== 'direct') {
        continue
      }

      it(`rewrites ${typeName}.${helperName}`, () => {
        const source = sourceForDirectHelper(typeName, helperName)
        const result = transformSource(source, { path: 'input.ts' })

        expect(result.diagnostics, `${typeName}.${helperName}`).toEqual([])
        expect(result.code, `${typeName}.${helperName}`).not.toContain(
          'temporal-polyfill/fns',
        )
      })
    }
  }
})

function sourceForDirectHelper(typeName: string, helperName: string): string {
  const callArgs = directCallArgs(typeName, helperName)
  if (callArgs == null) {
    throw new Error(`Missing direct fixture for ${typeName}.${helperName}`)
  }

  if (typeName === 'Now') {
    return `
import * as NowFns from 'temporal-polyfill/fns/Now'

const result = NowFns.${helperName}(${callArgs})
`
  }

  return `
${
  callArgs.includes('CalendarFns.')
    ? "import * as CalendarFns from 'temporal-polyfill/fns/Calendar'\n"
    : ''
}import * as ${typeName}Fns from 'temporal-polyfill/fns/${typeName}'

const result = ${typeName}Fns.${helperName}(${callArgs})
`
}

function directCallArgs(typeName: string, helperName: string): string | null {
  const receiver = receiverByType[typeName]
  const other = otherByType[typeName]

  if (typeName === 'Now') {
    return helperName.includes('ISO') ? "'UTC'" : ''
  }

  if (helperName === 'isRecord') {
    return 'value'
  }

  if (helperName === 'create') {
    return createArgs(typeName)
  }

  if (helperName === 'fromFields') {
    return fromFieldsArgs(typeName)
  }

  if (helperName === 'fromString') {
    return fromStringArgs(typeName)
  }

  if (helperName === 'fromEpochMilliseconds') {
    return '1714570200000'
  }

  if (helperName === 'fromEpochNanoseconds') {
    return '1714570200000000000n'
  }

  if (helperName === 'compare') {
    return `${receiver}, ${other}`
  }

  if (helperName === 'equals') {
    return `${receiver}, ${other}`
  }

  if (helperName === 'add' || helperName === 'subtract') {
    return `${receiver}, durationLike, options`
  }

  if (helperName === 'diff') {
    return `${receiver}, ${other}, options`
  }

  if (isSingleUnitArithmetic(helperName)) {
    return `${receiver}, 1, options`
  }

  if (
    isZeroArgReceiverMethod(helperName) ||
    isReceiverProperty(typeName, helperName)
  ) {
    return receiver
  }

  if (helperName === 'withFields') {
    return `${receiver}, fields, options`
  }

  if (helperName === 'withCalendar') {
    return `${receiver}, CalendarFns.getBuddhist()`
  }

  if (helperName === 'withTimeZone') {
    return `${receiver}, 'UTC'`
  }

  if (helperName === 'withPlainTime') {
    return `${receiver}, plainTime`
  }

  if (helperName === 'round' || helperName === 'total') {
    return `${receiver}, options`
  }

  if (helperName === 'getTimeZoneTransition') {
    return `${receiver}, 'next'`
  }

  if (helperName === 'toString') {
    return `${receiver}, options`
  }

  if (helperName === 'toBasicString') {
    return receiver
  }

  if (helperName === 'toLocaleString') {
    return `${receiver}, 'en-US', options`
  }

  if (helperName === 'toZonedDateTime') {
    return `${receiver}, { timeZone: 'UTC' }`
  }

  if (helperName === 'toZonedDateTimeISO') {
    return `${receiver}, 'UTC'`
  }

  if (
    helperName === 'toPlainDate' &&
    (typeName === 'PlainYearMonth' || typeName === 'PlainMonthDay')
  ) {
    return `${receiver}, { day: 1, year: 2024 }`
  }

  if (helperName === 'toNative') {
    return receiver
  }

  return null
}

function createArgs(typeName: string): string {
  switch (typeName) {
    case 'Instant':
      return '1714570200000000000n'
    case 'ZonedDateTime':
      return "1714570200000000000n, 'UTC', CalendarFns.getISO()"
    case 'PlainDateTime':
      return '2024, 5, 1, 9, 30, 0, 0, 0, 0, CalendarFns.getGregory()'
    case 'PlainDate':
      return '2024, 5, 1, CalendarFns.getBuddhist()'
    case 'PlainTime':
      return '9, 30'
    case 'PlainYearMonth':
      return '2024, 5, CalendarFns.getISO(), 1'
    case 'PlainMonthDay':
      return '5, 1, CalendarFns.getISO(), 1972'
    case 'Duration':
      return '0, 0, 0, 0, 1, 30'
    default:
      throw new Error(`Missing create args for ${typeName}`)
  }
}

function fromFieldsArgs(typeName: string): string {
  switch (typeName) {
    case 'ZonedDateTime':
      return "{ year: 2024, month: 5, day: 1, timeZone: 'UTC', calendar: CalendarFns.getISO() }, options"
    case 'PlainDateTime':
      return '{ year: 2024, month: 5, day: 1, calendar: CalendarFns.getISO() }, options'
    case 'PlainDate':
      return '{ year: 2024, month: 5, day: 1, calendar: CalendarFns.getISO() }, options'
    case 'PlainTime':
      return '{ hour: 9, minute: 30 }, options'
    case 'PlainYearMonth':
      return '{ year: 2024, month: 5, calendar: CalendarFns.getISO() }, options'
    case 'PlainMonthDay':
      return '{ month: 5, day: 1, calendar: CalendarFns.getISO() }, options'
    case 'Duration':
      return '{ hours: 1, minutes: 30 }'
    default:
      throw new Error(`Missing fromFields args for ${typeName}`)
  }
}

function fromStringArgs(typeName: string): string {
  switch (typeName) {
    case 'Instant':
      return 'value'
    case 'ZonedDateTime':
    case 'PlainDateTime':
    case 'PlainDate':
    case 'PlainYearMonth':
    case 'PlainMonthDay':
      return 'value, CalendarFns.getBasic'
    case 'PlainTime':
    case 'Duration':
      return 'value'
    default:
      throw new Error(`Missing fromString args for ${typeName}`)
  }
}

function isSingleUnitArithmetic(helperName: string): boolean {
  return /^(add|subtract)(Years|Months|Weeks|Days|Hours|Minutes|Seconds|Milliseconds|Microseconds|Nanoseconds)$/.test(
    helperName,
  )
}

function isZeroArgReceiverMethod(helperName: string): boolean {
  return new Set([
    'abs',
    'negated',
    'toInstant',
    'toPlainDateTime',
    'toPlainDate',
    'toPlainTime',
    'toPlainYearMonth',
    'toPlainMonthDay',
    'startOfDay',
  ]).has(helperName)
}

function isReceiverProperty(typeName: string, helperName: string): boolean {
  const propertiesByType: Record<string, Set<string>> = {
    Instant: new Set(['epochMilliseconds', 'epochNanoseconds']),
    ZonedDateTime: new Set([
      'offsetNanoseconds',
      'offset',
      'dayOfWeek',
      'daysInWeek',
      'weekOfYear',
      'yearOfWeek',
      'dayOfYear',
      'daysInMonth',
      'daysInYear',
      'monthsInYear',
      'inLeapYear',
      'hoursInDay',
    ]),
    PlainDateTime: new Set([
      'dayOfWeek',
      'daysInWeek',
      'weekOfYear',
      'yearOfWeek',
      'dayOfYear',
      'daysInMonth',
      'daysInYear',
      'monthsInYear',
      'inLeapYear',
    ]),
    PlainDate: new Set([
      'dayOfWeek',
      'daysInWeek',
      'weekOfYear',
      'yearOfWeek',
      'dayOfYear',
      'daysInMonth',
      'daysInYear',
      'monthsInYear',
      'inLeapYear',
    ]),
    PlainYearMonth: new Set([
      'daysInMonth',
      'daysInYear',
      'monthsInYear',
      'inLeapYear',
    ]),
    Duration: new Set(['sign', 'blank']),
  }

  return propertiesByType[typeName]?.has(helperName) ?? false
}
