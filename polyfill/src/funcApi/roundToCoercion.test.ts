import { describe, expect, it } from 'vitest'
import * as CalendarFns from './calendar'
import * as PlainDateFns from './plainDate'
import * as PlainDateTimeFns from './plainDateTime'
import * as PlainYearMonthFns from './plainYearMonth'
import * as ZonedDateTimeFns from './zonedDateTime'

/*
Year, month and week rounding only allows an increment of 1, but the option still
coerces like every other roundingIncrement. On a host with native Temporal these
helpers go through temporal-utils, which used to compare the raw value to 1.
Node 26 is what exercises that path: VITEST_NODE_VERSION=26.5.0 pnpm run vitest
*/

const plainDate = PlainDateFns.fromString('2024-07-27', CalendarFns.getBasic)
const plainDateTime = PlainDateTimeFns.fromString(
  '2024-07-27T12:00',
  CalendarFns.getBasic,
)
const plainYearMonth = PlainYearMonthFns.fromString(
  '2024-07',
  CalendarFns.getBasic,
)
const zonedDateTime = ZonedDateTimeFns.fromString(
  '2024-07-27T12:00[UTC]',
  CalendarFns.getBasic,
)

// Each rounds with the given options and returns a comparable string
const helpers: [string, (options: any) => string][] = [
  [
    'PlainDate.roundToYear',
    (o) => PlainDateFns.toString(PlainDateFns.roundToYear(plainDate, o)),
  ],
  [
    'PlainDate.roundToMonth',
    (o) => PlainDateFns.toString(PlainDateFns.roundToMonth(plainDate, o)),
  ],
  [
    'PlainDate.roundToWeek',
    (o) => PlainDateFns.toString(PlainDateFns.roundToWeek(plainDate, o)),
  ],
  [
    'PlainDateTime.roundToYear',
    (o) =>
      PlainDateTimeFns.toString(PlainDateTimeFns.roundToYear(plainDateTime, o)),
  ],
  [
    'PlainDateTime.roundToMonth',
    (o) =>
      PlainDateTimeFns.toString(
        PlainDateTimeFns.roundToMonth(plainDateTime, o),
      ),
  ],
  [
    'PlainDateTime.roundToWeek',
    (o) =>
      PlainDateTimeFns.toString(PlainDateTimeFns.roundToWeek(plainDateTime, o)),
  ],
  [
    'PlainYearMonth.roundToYear',
    (o) =>
      PlainYearMonthFns.toString(
        PlainYearMonthFns.roundToYear(plainYearMonth, o),
      ),
  ],
  [
    'ZonedDateTime.roundToYear',
    (o) =>
      ZonedDateTimeFns.toString(ZonedDateTimeFns.roundToYear(zonedDateTime, o)),
  ],
  [
    'ZonedDateTime.roundToMonth',
    (o) =>
      ZonedDateTimeFns.toString(
        ZonedDateTimeFns.roundToMonth(zonedDateTime, o),
      ),
  ],
  [
    'ZonedDateTime.roundToWeek',
    (o) =>
      ZonedDateTimeFns.toString(ZonedDateTimeFns.roundToWeek(zonedDateTime, o)),
  ],
]

describe.each(helpers)('%s roundingIncrement', (_name, round) => {
  const expected = round({ roundingMode: 'floor' })

  it.each([
    ['a fraction above 1', 1.9],
    ['a boolean', true],
    ['a string', '1'],
    ['an object', { valueOf: () => 1 }],
  ])('coerces %s to 1', (_label, roundingIncrement) => {
    expect(round({ roundingMode: 'floor', roundingIncrement })).toBe(expected)
  })

  it.each([
    ['above 1 after truncating', 2.9],
    ['below 1 after truncating', 0.5],
    ['zero', false],
    ['not a number', 'x'],
  ])('rejects %s', (_label, roundingIncrement) => {
    expect(() => round({ roundingIncrement })).toThrow(RangeError)
  })
})
