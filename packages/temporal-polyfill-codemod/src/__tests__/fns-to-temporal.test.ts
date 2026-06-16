import { describe, expect, it } from 'vitest'
import { transformSource } from '../index.js'

describe('fns-to-temporal', () => {
  it('rewrites PlainDate namespace calls and calendar getters', () => {
    const source = `
import * as CalendarFns from 'temporal-polyfill/fns/Calendar'
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'

const date = PlainDateFns.create(2024, 5, 1, CalendarFns.getBuddhist())
const next = PlainDateFns.addDays(date, 3)
const day = PlainDateFns.dayOfWeek(next)
const same = PlainDateFns.equals(date, next)
`

    const result = transformSource(source, { path: 'input.ts' })

    expect(result.diagnostics).toEqual([])
    expect(result.code).toContain(
      "const date = new Temporal.PlainDate(2024, 5, 1, 'buddhist')",
    )
    expect(result.code).toContain('const next = date.add({\n  days: 3\n})')
    expect(result.code).toContain('const day = next.dayOfWeek')
    expect(result.code).toContain('const same = date.equals(next)')
    expect(result.code).not.toContain('temporal-polyfill/fns')
  })

  it('rewrites named PlainDate imports', () => {
    const source = `
import { create, compare, isRecord } from 'temporal-polyfill/fns/PlainDate'

const date = create(2024, 5, 1)
const order = compare(date, other)
const ok = isRecord(value)
`

    const result = transformSource(source, { path: 'input.ts' })

    expect(result.diagnostics).toEqual([])
    expect(result.code).toContain(
      'const date = new Temporal.PlainDate(2024, 5, 1)',
    )
    expect(result.code).toContain(
      'const order = Temporal.PlainDate.compare(date, other)',
    )
    expect(result.code).toContain(
      'const ok = value instanceof Temporal.PlainDate',
    )
    expect(result.code).not.toContain('temporal-polyfill/fns')
  })

  it('rewrites documented type imports', () => {
    const source = `
import type { OverflowOptions, RoundingMode } from 'temporal-polyfill/fns'
import type { Record as PlainDateRecord, DiffOptions } from 'temporal-polyfill/fns/PlainDate'
import type * as CalendarFns from 'temporal-polyfill/fns/Calendar'

type A = OverflowOptions
type B = RoundingMode
type C = PlainDateRecord
type D = DiffOptions
type E = CalendarFns.Record
`

    const result = transformSource(source, { path: 'input.ts' })

    expect(result.diagnostics).toEqual([])
    expect(result.needsTemporalUtils).toBe(true)
    expect(result.code).toContain(
      "import type { RoundingMode } from 'temporal-utils'",
    )
    expect(result.code).toContain('type A = Temporal.OverflowOptions')
    expect(result.code).toContain('type B = RoundingMode')
    expect(result.code).toContain('type C = Temporal.PlainDate')
    expect(result.code).toContain(
      'type D = Temporal.RoundingOptionsWithLargestUnit<Temporal.DateUnit>',
    )
    expect(result.code).toContain('type E = string')
    expect(result.code).not.toContain('temporal-polyfill/fns')
  })

  it('keeps rewriting fns namespace types after unrelated qualified types', () => {
    const source = `
import type { JSX } from 'preact'
import type * as CalendarFns from 'temporal-polyfill/fns/Calendar'
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'

function handle(event: JSX.TargetedEvent<HTMLSelectElement>) {
  return event.currentTarget.value
}

function getToday(calendar: CalendarFns.Record): PlainDateFns.Record {
  return PlainDateFns.create(2024, 5, 1, calendar)
}
`

    const result = transformSource(source, { path: 'input.tsx' })

    expect(result.diagnostics).toEqual([])
    expect(result.code).toContain(
      'function handle(event: JSX.TargetedEvent<HTMLSelectElement>)',
    )
    expect(result.code).toContain(
      'function getToday(calendar: string): Temporal.PlainDate',
    )
    expect(result.code).not.toContain('CalendarFns.Record')
    expect(result.code).not.toContain('PlainDateFns.Record')
    expect(result.code).not.toContain('temporal-polyfill/fns')
  })

  it('removes fns namespace imports after value and type references are rewritten', () => {
    const source = `
import type * as CalendarFns from 'temporal-polyfill/fns/Calendar'
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'
import * as PlainMonthDayFns from 'temporal-polyfill/fns/PlainMonthDay'

function flow(calendar: CalendarFns.Record, date: PlainDateFns.Record, birthday: PlainMonthDayFns.Record) {
  const next = PlainDateFns.addDays(date, 1)
  const monthDay = PlainDateFns.toPlainMonthDay(next)
  return PlainMonthDayFns.toPlainDate(monthDay, { year: 2024 }).withCalendar(calendar)
}
`

    const result = transformSource(source, { path: 'input.ts' })

    expect(result.diagnostics).toEqual([])
    expect(result.code).toContain(
      'function flow(calendar: string, date: Temporal.PlainDate, birthday: Temporal.PlainMonthDay)',
    )
    expect(result.code).toContain('const next = date.add({')
    expect(result.code).toContain('const monthDay = next.toPlainMonthDay()')
    expect(result.code).toContain(
      'return monthDay.toPlainDate({ year: 2024 }).withCalendar(calendar)',
    )
    expect(result.code).not.toContain('temporal-polyfill/fns')
  })

  it('rewrites createFormat to Intl.DateTimeFormat', () => {
    const source = `
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'
import * as ZonedDateTimeFns from 'temporal-polyfill/fns/ZonedDateTime'

const dateFormat = PlainDateFns.createFormat(undefined, {
  calendar: calendarId,
  dateStyle: 'full',
})
const zdtFormat = ZonedDateTimeFns.createFormat('en-US', options)
`

    const result = transformSource(source, { path: 'input.ts' })

    expect(result.diagnostics).toEqual([])
    expect(result.code).toContain(
      'const dateFormat = new Intl.DateTimeFormat(undefined, {',
    )
    expect(result.code).toContain(
      "const zdtFormat = new Intl.DateTimeFormat('en-US', options)",
    )
    expect(result.code).not.toContain('createFormat')
    expect(result.code).not.toContain('temporal-polyfill/fns')
  })

  it('rewrites Instant direct Temporal mappings', () => {
    const source = `
import * as InstantFns from 'temporal-polyfill/fns/Instant'

const instant = InstantFns.create(1714570200000000000n)
const parsed = InstantFns.fromString(value)
const fromMs = InstantFns.fromEpochMilliseconds(1714570200000)
const later = InstantFns.addHours(instant, 2)
const duration = InstantFns.diff(instant, other)
const zdt = InstantFns.toZonedDateTimeISO(instant, 'UTC')
const ok = InstantFns.isRecord(value)
`

    const result = transformSource(source, { path: 'input.ts' })

    expect(result.diagnostics).toEqual([])
    expect(result.code).toContain(
      'const instant = new Temporal.Instant(1714570200000000000n)',
    )
    expect(result.code).toContain('const parsed = Temporal.Instant.from(value)')
    expect(result.code).toContain(
      'const fromMs = Temporal.Instant.fromEpochMilliseconds(1714570200000)',
    )
    expect(result.code).toContain('const later = instant.add({\n  hours: 2\n})')
    expect(result.code).toContain('const duration = instant.until(other)')
    expect(result.code).toContain(
      "const zdt = instant.toZonedDateTimeISO('UTC')",
    )
    expect(result.code).toContain(
      'const ok = value instanceof Temporal.Instant',
    )
    expect(result.code).not.toContain('temporal-polyfill/fns')
  })

  it('rewrites date-time and time direct Temporal mappings', () => {
    const source = `
import * as CalendarFns from 'temporal-polyfill/fns/Calendar'
import * as PlainDateTimeFns from 'temporal-polyfill/fns/PlainDateTime'
import { create as createTime, addMinutes, compare } from 'temporal-polyfill/fns/PlainTime'

const dateTime = PlainDateTimeFns.create(2024, 5, 1, 9, 30, 0, 0, 0, 0, CalendarFns.getGregory())
const fromFields = PlainDateTimeFns.fromFields({ year: 2024, month: 5, day: 1, calendar: CalendarFns.getISO() })
const changed = PlainDateTimeFns.withCalendar(dateTime, CalendarFns.getAny(calendarId))
const date = PlainDateTimeFns.toPlainDate(changed)
const time = createTime(9, 30)
const later = addMinutes(time, 15)
const order = compare(time, later)
`

    const result = transformSource(source, { path: 'input.ts' })

    expect(result.diagnostics).toEqual([])
    expect(result.code).toContain(
      "const dateTime = new Temporal.PlainDateTime(2024, 5, 1, 9, 30, 0, 0, 0, 0, 'gregory')",
    )
    expect(result.code).toContain("calendar: 'iso8601'")
    expect(result.code).toContain(
      'const changed = dateTime.withCalendar(calendarId)',
    )
    expect(result.code).toContain('const date = changed.toPlainDate()')
    expect(result.code).toContain('const time = new Temporal.PlainTime(9, 30)')
    expect(result.code).toContain('const later = time.add({\n  minutes: 15\n})')
    expect(result.code).toContain(
      'const order = Temporal.PlainTime.compare(time, later)',
    )
    expect(result.code).not.toContain('temporal-polyfill/fns')
  })

  it('rewrites year-month and month-day direct Temporal mappings', () => {
    const source = `
import * as CalendarFns from 'temporal-polyfill/fns/Calendar'
import * as PlainYearMonthFns from 'temporal-polyfill/fns/PlainYearMonth'
import * as PlainMonthDayFns from 'temporal-polyfill/fns/PlainMonthDay'

const yearMonth = PlainYearMonthFns.create(2024, 5, CalendarFns.getBuddhist(), 1)
const nextYearMonth = PlainYearMonthFns.addMonths(yearMonth, 1)
const days = PlainYearMonthFns.daysInMonth(nextYearMonth)
const date = PlainYearMonthFns.toPlainDate(yearMonth, { day: 1 })
const monthDay = PlainMonthDayFns.create(5, 1, CalendarFns.getISO(), 1972)
const same = PlainMonthDayFns.equals(monthDay, otherMonthDay)
const date2 = PlainMonthDayFns.toPlainDate(monthDay, { year: 2024 })
`

    const result = transformSource(source, { path: 'input.ts' })

    expect(result.diagnostics).toEqual([])
    expect(result.code).toContain(
      "const yearMonth = new Temporal.PlainYearMonth(2024, 5, 'buddhist', 1)",
    )
    expect(result.code).toContain(
      'const nextYearMonth = yearMonth.add({\n  months: 1\n})',
    )
    expect(result.code).toContain('const days = nextYearMonth.daysInMonth')
    expect(result.code).toContain(
      'const date = yearMonth.toPlainDate({ day: 1 })',
    )
    expect(result.code).toContain(
      "const monthDay = new Temporal.PlainMonthDay(5, 1, 'iso8601', 1972)",
    )
    expect(result.code).toContain('const same = monthDay.equals(otherMonthDay)')
    expect(result.code).toContain(
      'const date2 = monthDay.toPlainDate({ year: 2024 })',
    )
    expect(result.code).not.toContain('temporal-polyfill/fns')
  })

  it('rewrites ZonedDateTime, Duration, and Now direct Temporal mappings', () => {
    const source = `
import * as CalendarFns from 'temporal-polyfill/fns/Calendar'
import * as ZonedDateTimeFns from 'temporal-polyfill/fns/ZonedDateTime'
import * as DurationFns from 'temporal-polyfill/fns/Duration'
import * as NowFns from 'temporal-polyfill/fns/Now'

const zdt = ZonedDateTimeFns.create(1714570200000000000n, 'UTC', CalendarFns.getISO())
const offset = ZonedDateTimeFns.offset(zdt)
const instant = ZonedDateTimeFns.toInstant(zdt)
const duration = DurationFns.create(0, 0, 0, 0, 1, 30)
const parsed = DurationFns.fromString('PT1H30M')
const abs = DurationFns.abs(duration)
const sign = DurationFns.sign(abs)
const order = DurationFns.compare(duration, parsed)
const now = NowFns.instant()
const zone = NowFns.timeZoneId()
`

    const result = transformSource(source, { path: 'input.ts' })

    expect(result.diagnostics).toEqual([])
    expect(result.code).toContain(
      "const zdt = new Temporal.ZonedDateTime(1714570200000000000n, 'UTC', 'iso8601')",
    )
    expect(result.code).toContain('const offset = zdt.offset')
    expect(result.code).toContain('const instant = zdt.toInstant()')
    expect(result.code).toContain(
      'const duration = new Temporal.Duration(0, 0, 0, 0, 1, 30)',
    )
    expect(result.code).toContain(
      "const parsed = Temporal.Duration.from('PT1H30M')",
    )
    expect(result.code).toContain('const abs = duration.abs()')
    expect(result.code).toContain('const sign = abs.sign')
    expect(result.code).toContain(
      'const order = Temporal.Duration.compare(duration, parsed)',
    )
    expect(result.code).toContain('const now = Temporal.Now.instant()')
    expect(result.code).toContain('const zone = Temporal.Now.timeZoneId()')
    expect(result.code).not.toContain('temporal-polyfill/fns')
  })

  it('rewrites nested Now calls before replacing outer fns calls', () => {
    const source = `
import * as NowFns from 'temporal-polyfill/fns/Now'
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'

const today = PlainDateFns.withCalendar(NowFns.plainDateISO(), calendar)
const zdt = PlainDateFns.toZonedDateTime(date, NowFns.timeZoneId())
`

    const result = transformSource(source, { path: 'input.ts' })

    expect(result.diagnostics).toEqual([])
    expect(result.code).toContain(
      'const today = Temporal.Now.plainDateISO().withCalendar(calendar)',
    )
    expect(result.code).toContain(
      'const zdt = date.toZonedDateTime(Temporal.Now.timeZoneId())',
    )
    expect(result.code).not.toContain('NowFns')
    expect(result.code).not.toContain('temporal-polyfill/fns')
  })

  it('rewrites statically-known native roundTo helpers to Temporal.round', () => {
    const source = `
import * as ZonedDateTimeFns from 'temporal-polyfill/fns/ZonedDateTime'
import { roundToMinute } from 'temporal-polyfill/fns/PlainTime'

const a = ZonedDateTimeFns.roundToHour(zdt)
const b = ZonedDateTimeFns.roundToHour(zdt, 'ceil')
const c = ZonedDateTimeFns.roundToHour(zdt, { roundingMode: 'floor' })
const d = roundToMinute(time, { roundingMode: 'halfExpand' })
`

    const result = transformSource(source, { path: 'input.ts' })

    expect(result.diagnostics).toEqual([])
    expect(result.needsTemporalUtils).toBe(false)
    expect(result.code).toContain(
      "const a = zdt.round({\n  smallestUnit: 'hour'\n})",
    )
    expect(result.code).toContain(
      "const b = zdt.round({\n  roundingMode: 'ceil',\n  smallestUnit: 'hour'\n})",
    )
    expect(result.code).toContain('const c = zdt.round({')
    expect(result.code).toContain("roundingMode: 'floor'")
    expect(result.code).toContain("smallestUnit: 'hour'")
    expect(result.code).toContain('const d = time.round({')
    expect(result.code).toContain("roundingMode: 'halfExpand'")
    expect(result.code).toContain("smallestUnit: 'minute'")
    expect(result.code).not.toContain('temporal-polyfill/fns')
  })

  it('rewrites ambiguous or non-native helpers through temporal-utils', () => {
    const source = `
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'
import * as ZonedDateTimeFns from 'temporal-polyfill/fns/ZonedDateTime'

const a = PlainDateFns.roundToYear(date, options)
const b = ZonedDateTimeFns.roundToHour(zdt, options)
const c = PlainDateFns.startOfWeek(date)
const d = PlainDateFns.withWeekOfYear(date, week, options)
const e = PlainDateFns.diffDays(date, otherDate, 'ceil')
const f = PlainDateFns.toBasicString(date)
`

    const result = transformSource(source, { path: 'input.ts' })

    expect(result.diagnostics).toEqual([])
    expect(result.needsTemporalUtils).toBe(true)
    expect(result.code).toContain("from 'temporal-utils'")
    for (const helper of [
      'diffDays',
      'roundToHour',
      'roundToYear',
      'startOfWeek',
      'withWeekOfYear',
    ]) {
      expect(result.code).toContain(helper)
    }
    expect(result.code).toContain('const a = roundToYear(date, options)')
    expect(result.code).toContain('const b = roundToHour(zdt, options)')
    expect(result.code).toContain('const c = startOfWeek(date)')
    expect(result.code).toContain(
      'const d = withWeekOfYear(date, week, options)',
    )
    expect(result.code).toContain("const e = diffDays(date, otherDate, 'ceil')")
    expect(result.code).toContain('const f = date.toString()')
    expect(result.code).not.toContain('temporal-polyfill/fns')
  })

  it('aliases temporal-utils imports when generated names would collide', () => {
    const source = `
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'

const startOfWeek = existingStartOfWeek
const start = PlainDateFns.startOfWeek(date)
const diff = PlainDateFns.diffDays(date, otherDate)
`

    const result = transformSource(source, { path: 'input.ts' })

    expect(result.diagnostics).toEqual([])
    expect(result.code).toContain(
      "import { diffDays, startOfWeek as startOfWeekTemporalUtils } from 'temporal-utils'",
    )
    expect(result.code).toContain('const startOfWeek = existingStartOfWeek')
    expect(result.code).toContain(
      'const start = startOfWeekTemporalUtils(date)',
    )
    expect(result.code).toContain('const diff = diffDays(date, otherDate)')
    expect(result.code).not.toContain('temporal-polyfill/fns')
  })

  it('does not report temporal-utils import specifiers as leftover fns named imports', () => {
    const source = `
import { diffMonths, startOfMonth } from 'temporal-polyfill/fns/PlainDate'

const start = startOfMonth(date)
const diff = diffMonths(date, otherDate)
`

    const result = transformSource(source, { path: 'input.ts' })

    expect(result.diagnostics).toEqual([])
    expect(result.code).toContain("from 'temporal-utils'")
    expect(result.code).toContain('const start = startOfMonth(date)')
    expect(result.code).toContain('const diff = diffMonths(date, otherDate)')
  })

  it('reuses existing temporal-utils import aliases', () => {
    const source = `
import { startOfWeek as localStartOfWeek } from 'temporal-utils'
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'

const start = PlainDateFns.startOfWeek(date)
`

    const result = transformSource(source, { path: 'input.ts' })

    expect(result.diagnostics).toEqual([])
    expect(result.code).toContain(
      "import { startOfWeek as localStartOfWeek } from 'temporal-utils'",
    )
    expect(result.code).not.toContain(
      "import { startOfWeek } from 'temporal-utils'",
    )
    expect(result.code).toContain('const start = localStartOfWeek(date)')
    expect(result.code).not.toContain('temporal-polyfill/fns')
  })

  it('keeps roundTo object literals that already specify smallestUnit', () => {
    const source = `
import * as ZonedDateTimeFns from 'temporal-polyfill/fns/ZonedDateTime'

const result = ZonedDateTimeFns.roundToHour(zdt, { smallestUnit: 'minute' })
`

    const result = transformSource(source, { path: 'input.ts' })

    expect(result.code).toContain(
      "import * as ZonedDateTimeFns from 'temporal-polyfill/fns/ZonedDateTime'",
    )
    expect(result.diagnostics.map((diagnostic) => diagnostic.message)).toEqual(
      expect.arrayContaining([
        'ZonedDateTime roundToHour options object already has smallestUnit; manual review needed',
        'Untransformed ZonedDateTimeFns.roundToHour usage',
      ]),
    )
  })

  it('keeps unsafe fns usages and emits diagnostics', () => {
    const source = `
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'

const fn = PlainDateFns.addDays
const key = 'addDays'
const next = PlainDateFns[key](date, 3)
const { create } = PlainDateFns
const dates = values.filter(PlainDateFns.isRecord)
`

    const result = transformSource(source, { path: 'input.ts' })

    expect(result.code).toContain(
      "import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'",
    )
    expect(result.code).toContain('const fn = PlainDateFns.addDays')
    expect(result.diagnostics.map((diagnostic) => diagnostic.message)).toEqual(
      expect.arrayContaining([
        'Untransformed PlainDateFns.addDays usage',
        'Untransformed dynamic PlainDateFns usage',
        'Untransformed PlainDateFns destructuring',
        'Untransformed PlainDateFns.isRecord usage',
      ]),
    )
  })
})
