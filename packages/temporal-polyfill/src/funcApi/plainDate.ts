import {
  PlainDateBag,
  plainDateWithFields,
  refinePlainDateBag,
} from '../internal/bagRefine'
import { refineCalendarId } from '../internal/calendarId'
import {
  createNativeDateModOps,
  createNativeDateRefineOps,
  createNativeDiffOps,
  createNativeMonthDayRefineOps,
  createNativeMoveOps,
  createNativeYearMonthRefineOps,
} from '../internal/calendarNativeQuery'
import { compareIsoDateFields, plainDatesEqual } from '../internal/compare'
import { constructPlainDateSlots } from '../internal/construct'
import {
  plainDateToPlainDateTime,
  plainDateToPlainMonthDay,
  plainDateToPlainYearMonth,
  plainDateToZonedDateTime,
} from '../internal/convert'
import { diffPlainDates } from '../internal/diff'
import { DateBag, DateFields } from '../internal/fields'
import { createFormatPrepper, dateConfig } from '../internal/intlFormatPrep'
import { LocalesArg } from '../internal/intlFormatUtils'
import { IsoDateFields, IsoDateTimeFields } from '../internal/isoFields'
import { formatPlainDateIso } from '../internal/isoFormat'
import { computeIsoDayOfWeek, computeIsoDaysInWeek } from '../internal/isoMath'
import { parsePlainDate } from '../internal/isoParse'
import { slotsWithCalendarId } from '../internal/modify'
import { moveByDays, movePlainDate } from '../internal/move'
import {
  CalendarDisplayOptions,
  DiffOptions,
  OverflowOptions,
  RoundingMathOptions,
  RoundingModeName,
  refineUnitRoundOptions,
} from '../internal/optionsRefine'
import { IsoDateTimeInterval } from '../internal/round'
import {
  DateSlots,
  PlainDateBranding,
  createPlainDateSlots,
} from '../internal/slots'
import { checkIsoDateInBounds } from '../internal/timeMath'
import { refineTimeZoneId } from '../internal/timeZoneId'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { DateUnitName, Unit } from '../internal/units'
import { NumberSign, bindArgs, identity, memoize } from '../internal/utils'
import {
  computeDateFields,
  computeDayOfYear,
  computeDaysInMonth,
  computeDaysInYear,
  computeInLeapYear,
  computeMonthsInYear,
  computeWeekOfYear,
  computeYearOfWeek,
  getCalendarId,
  getCalendarIdFromBag,
} from './calendarUtils'
import {
  diffPlainDays,
  diffPlainMonths,
  diffPlainWeeks,
  diffPlainYears,
} from './diffUtils'
import * as DurationFns from './duration'
import { createFormatCache } from './intlFormatCache'
import {
  moveByDaysStrict,
  moveByIsoWeeks,
  moveByMonths,
  moveByYears,
  moveToDayOfMonth,
  moveToDayOfWeek,
  moveToDayOfYear,
  reversedMove,
  slotsWithWeekOfYear,
} from './moveUtils'
import * as PlainDateTimeFns from './plainDateTime'
import * as PlainMonthDayFns from './plainMonthDay'
import * as PlainTimeFns from './plainTime'
import * as PlainYearMonthFns from './plainYearMonth'
import {
  computeIsoWeekCeil,
  computeIsoWeekFloor,
  computeIsoWeekInterval,
  computeMonthCeil,
  computeMonthFloor,
  computeMonthInterval,
  computeYearCeil,
  computeYearFloor,
  computeYearInterval,
  roundDateTimeToInterval,
} from './roundUtils'
import * as ZonedDateTimeFns from './zonedDateTime'

export type Record = {
  /**
   * @deprecated Use the isInstance() function instead.
   */
  readonly branding: typeof PlainDateBranding

  /**
   * @deprecated Use the calendarId() function instead.
   */
  readonly calendar: string

  /**
   * @deprecated Use the getISOFields() function instead.
   */
  readonly isoYear: number

  /**
   * @deprecated Use the getISOFields() function instead.
   */
  readonly isoMonth: number

  /**
   * @deprecated Use the getISOFields() function instead.
   */
  readonly isoDay: number
}

export type Fields = DateFields
export type FromFields = PlainDateBag
export type WithFields = DateBag
export type ISOFields = IsoDateFields

export type AssignmentOptions = OverflowOptions
export type ArithmeticOptions = OverflowOptions
export type DifferenceOptions = DiffOptions<DateUnitName>
export type ToStringOptions = CalendarDisplayOptions
export type ToZonedDateTimeOptions = {
  timeZone: string
  plainTime?: PlainTimeFns.Record
}

// Creation / Parsing
// -----------------------------------------------------------------------------

export const create = bindArgs(constructPlainDateSlots, refineCalendarId) as (
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendar?: string,
) => Record

export function fromFields(
  fields: FromFields,
  options?: AssignmentOptions,
): Record {
  return refinePlainDateBag(
    createNativeDateRefineOps(getCalendarIdFromBag(fields)),
    fields,
    options,
  )
}

export const fromString = parsePlainDate as (s: string) => Record

export function isInstance(record: any): record is Record {
  return Boolean(record) && record.branding === PlainDateBranding
}

// Getters
// -----------------------------------------------------------------------------

export const getFields = memoize(computeDateFields, WeakMap) as (
  record: Record,
) => Fields

export const getISOFields = identity as (record: Record) => ISOFields

export const calendarId = getCalendarId as (record: Record) => string

export const dayOfWeek = computeIsoDayOfWeek as (record: Record) => number

export const daysInWeek = computeIsoDaysInWeek as (record: Record) => number

export const weekOfYear = computeWeekOfYear as (
  record: Record,
) => number | undefined

export const yearOfWeek = computeYearOfWeek as (
  record: Record,
) => number | undefined

export const dayOfYear = computeDayOfYear as (record: Record) => number

export const daysInMonth = computeDaysInMonth as (record: Record) => number

export const daysInYear = computeDaysInYear as (record: Record) => number

export const monthsInYear = computeMonthsInYear as (record: Record) => number

export const inLeapYear = computeInLeapYear as (record: Record) => boolean

// Setters
// -----------------------------------------------------------------------------

export function withFields(
  record: Record,
  fields: WithFields,
  options?: AssignmentOptions,
): Record {
  return plainDateWithFields(createNativeDateModOps, record, fields, options)
}

export function withCalendar(record: Record, calendar: string): Record {
  return slotsWithCalendarId(record, refineCalendarId(calendar))
}

// Math
// -----------------------------------------------------------------------------

export const add = bindArgs(movePlainDate, createNativeMoveOps, false) as (
  plainDateRecord: Record,
  durationRecord: DurationFns.Record,
  options?: ArithmeticOptions,
) => Record

export const subtract = bindArgs(movePlainDate, createNativeMoveOps, true) as (
  plainDateRecord: Record,
  durationRecord: DurationFns.Record,
  options?: ArithmeticOptions,
) => Record

export const until = bindArgs(diffPlainDates, createNativeDiffOps, false) as (
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
) => DurationFns.Record

export const since = bindArgs(diffPlainDates, createNativeDiffOps, true) as (
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
) => DurationFns.Record

export const equals = plainDatesEqual as (
  record0: Record,
  record1: Record,
) => boolean

export const compare = compareIsoDateFields as (
  record0: Record,
  record1: Record,
) => NumberSign

// Conversion
// -----------------------------------------------------------------------------

export function toZonedDateTime(
  record: Record,
  options: string | ToZonedDateTimeOptions,
): ZonedDateTimeFns.Record {
  const optionsObj =
    typeof options === 'string' ? { timeZone: options } : options

  return plainDateToZonedDateTime(
    refineTimeZoneId,
    identity,
    queryNativeTimeZone,
    record,
    optionsObj,
  )
}

export const toPlainDateTime = plainDateToPlainDateTime as (
  plainDateRecord: Record,
  plainTimeRecord?: PlainTimeFns.Record,
) => PlainDateTimeFns.Record

export function toPlainYearMonth(record: Record): PlainYearMonthFns.Record {
  return plainDateToPlainYearMonth(
    createNativeYearMonthRefineOps,
    record,
    getFields(record),
  )
}

export function toPlainMonthDay(record: Record): PlainMonthDayFns.Record {
  return plainDateToPlainMonthDay(
    createNativeMonthDayRefineOps,
    record,
    getFields(record),
  )
}

// Formatting
// -----------------------------------------------------------------------------

const prepFormat = createFormatPrepper(
  dateConfig,
  /*@__PURE__*/ createFormatCache(),
)

export function toLocaleString(
  record: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepFormat(locales, options, record)
  return format.format(epochMilli)
}

export function toLocaleStringParts(
  record: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli] = prepFormat(locales, options, record)
  return format.formatToParts(epochMilli)
}

export function rangeToLocaleString(
  record0: Record,
  record1: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli0, epochMilli1] = prepFormat(
    locales,
    options,
    record0,
    record1,
  )
  return format.formatRange(epochMilli0, epochMilli1!)
}

export function rangeToLocaleStringParts(
  record0: Record,
  record1: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): ReturnType<Intl.DateTimeFormat['formatRangeToParts']> {
  const [format, epochMilli0, epochMilli1] = prepFormat(
    locales,
    options,
    record0,
    record1,
  )
  return format.formatRangeToParts(epochMilli0, epochMilli1!)
}

export const toString = formatPlainDateIso as (
  record: Record,
  options?: ToStringOptions,
) => string

// Non-standard: With
// -----------------------------------------------------------------------------

export function withDayOfYear(
  record: Record,
  dayOfYear: number,
  options?: OverflowOptions,
): Record {
  return createPlainDateSlots(
    checkIsoDateInBounds(moveToDayOfYear(record, dayOfYear, options)),
  )
}

export function withDayOfMonth(
  record: Record,
  dayOfMonth: number,
  options?: OverflowOptions,
): Record {
  return createPlainDateSlots(
    checkIsoDateInBounds(moveToDayOfMonth(record, dayOfMonth, options)),
  )
}

export function withDayOfWeek(
  record: Record,
  dayOfWeek: number,
  options?: OverflowOptions,
): Record {
  return createPlainDateSlots(
    checkIsoDateInBounds(moveToDayOfWeek(record, dayOfWeek, options)),
  )
}

export function withWeekOfYear(
  record: Record,
  weekOfYear: number,
  options?: OverflowOptions,
): Record {
  return createPlainDateSlots(
    checkIsoDateInBounds(slotsWithWeekOfYear(record, weekOfYear, options)),
  )
}

// Non-standard: Move
// -----------------------------------------------------------------------------

export function addYears(
  record: Record,
  years: number,
  options?: OverflowOptions,
): Record {
  // No need for createPlainDateTimeSlots because moveByYears guarantees IsoDateFields
  return checkIsoDateInBounds(moveByYears(record, years, options))
}

export function addMonths(
  record: Record,
  months: number,
  options?: OverflowOptions,
): Record {
  // No need for createPlainDateTimeSlots because moveByMonths guarantees IsoDateFields
  return checkIsoDateInBounds(moveByMonths(record, months, options))
}

export function addWeeks(record: Record, weeks: number): Record {
  return createPlainDateSlots(
    checkIsoDateInBounds(moveByIsoWeeks(record, weeks)),
  )
}

export function addDays(record: Record, days: number): Record {
  return createPlainDateSlots(
    checkIsoDateInBounds(moveByDaysStrict(record, days)),
  )
}

// Non-standard: Subtract
// -----------------------------------------------------------------------------

export const subtractYears = reversedMove(addYears)
export const subtractMonths = reversedMove(addMonths)
export const subtractWeeks = reversedMove(addWeeks)
export const subtractDays = reversedMove(addDays)

// Non-standard: Round
// -----------------------------------------------------------------------------

export const roundToYear = bindArgs(
  roundToInterval,
  Unit.Year,
  computeYearInterval,
)

export const roundToMonth = bindArgs(
  roundToInterval,
  Unit.Month,
  computeMonthInterval,
)

export const roundToWeek = bindArgs(
  roundToInterval,
  Unit.Week,
  computeIsoWeekInterval,
)

// Non-standard: Start-of-Unit
// -----------------------------------------------------------------------------

export const startOfYear = aligned(computeYearFloor)
export const startOfMonth = aligned(computeMonthFloor)
export const startOfWeek = aligned(computeIsoWeekFloor)

// Non-standard: End-of-Unit
// -----------------------------------------------------------------------------

export const endOfYear = aligned(computeYearCeil, -1)
export const endOfMonth = aligned(computeMonthCeil, -1)
export const endOfWeek = aligned(computeIsoWeekCeil, -1)

// Non-standard: Diffing
// -----------------------------------------------------------------------------

export const diffYears = diffPlainYears as (
  record0: Record,
  record1: Record,
  options?: RoundingModeName | RoundingMathOptions,
) => number

export const diffMonths = diffPlainMonths as (
  record0: Record,
  record1: Record,
  options?: RoundingModeName | RoundingMathOptions,
) => number

export const diffWeeks = diffPlainWeeks as (
  record0: Record,
  record1: Record,
  options?: RoundingModeName | RoundingMathOptions,
) => number

export const diffDays = diffPlainDays as (
  record0: Record,
  record1: Record,
  options?: RoundingModeName | RoundingMathOptions,
) => number

// Non-standard: Utils
// -----------------------------------------------------------------------------

function roundToInterval(
  unit: Unit,
  computeInterval: (isoFields: DateSlots) => IsoDateTimeInterval,
  record0: Record,
  options?: RoundingModeName | RoundingMathOptions,
): Record {
  const [, roundingMode] = refineUnitRoundOptions(unit, options)
  const isoFields = roundDateTimeToInterval(
    computeInterval,
    record0,
    roundingMode,
  )
  return createPlainDateSlots(
    checkIsoDateInBounds({ ...record0, ...isoFields }),
  )
}

function aligned(
  computeAlignment: (slots: DateSlots) => IsoDateTimeFields,
  dayDelta = 0,
): (record: Record) => Record {
  return (record0) => {
    const isoFields = moveByDays(computeAlignment(record0), dayDelta)
    return createPlainDateSlots(
      checkIsoDateInBounds({ ...record0, ...isoFields }),
    )
  }
}
