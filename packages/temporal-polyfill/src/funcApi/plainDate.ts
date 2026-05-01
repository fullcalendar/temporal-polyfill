import { refineCalendarId } from '../internal/calendarId'
import { compareIsoDateFields, plainDatesEqual } from '../internal/compare'
import { constructPlainDateSlots } from '../internal/construct'
import {
  convertToPlainMonthDay,
  convertToPlainYearMonth,
  plainDateToZonedDateTime,
} from '../internal/convert'
import { refinePlainDateObjectLike } from '../internal/createFromFields'
import { diffPlainDates } from '../internal/diff'
import { CalendarDateFields } from '../internal/fieldTypes'
import { DateLikeObject } from '../internal/fieldTypes'
import { DateFields } from '../internal/fieldTypes'
import { createFormatPrepper, dateConfig } from '../internal/intlFormatPrep'
import { LocalesArg } from '../internal/intlFormatUtils'
import { IsoDateCarrier } from '../internal/isoFields'
import { formatPlainDateIso } from '../internal/isoFormat'
import { computeIsoDayOfWeek } from '../internal/isoMath'
import { parsePlainDate } from '../internal/isoParse'
import { mergePlainDateFields } from '../internal/merge'
import { slotsWithCalendarId } from '../internal/modify'
import { moveByDays, movePlainDate } from '../internal/move'
import {
  CalendarDisplayOptions,
  DiffOptions,
  OverflowOptions,
  RoundingMathOptions,
  RoundingModeName,
} from '../internal/optionsModel'
import { refineUnitRoundOptions } from '../internal/optionsRoundingRefine'
import { IsoDateTimeInterval } from '../internal/round'
import {
  AbstractDateSlots,
  PlainDateBranding,
  PlainDateSlots,
  createPlainDateSlots,
} from '../internal/slots'
import { createPlainDateTimeFromRefinedFields } from '../internal/slotsFromRefinedFields'
import { checkIsoDateInBounds } from '../internal/timeMath'
import { refineTimeZoneId } from '../internal/timeZoneId'
import { DateUnitName, Unit } from '../internal/units'
import { NumberSign, bindArgs, memoize } from '../internal/utils'
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

export type Record = PlainDateSlots

export type Fields = DateFields
export type FromFields = DateLikeObject
export type WithFields = Partial<DateFields>
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

export const create = constructPlainDateSlots as (
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendar?: string,
) => Record

export function fromFields(
  fields: FromFields,
  options?: AssignmentOptions,
): Record {
  return refinePlainDateObjectLike(
    getCalendarIdFromBag(fields),
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

export const calendarId = getCalendarId as (record: Record) => string

export const dayOfWeek = ((record: Record) =>
  computeIsoDayOfWeek(record.isoDate)) as (record: Record) => number

export const daysInWeek = (() => 7) as (record: Record) => number

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
  return mergePlainDateFields(record, fields, options)
}

export function withCalendar(record: Record, calendar: string): Record {
  return slotsWithCalendarId(record, refineCalendarId(calendar))
}

// Math
// -----------------------------------------------------------------------------

export const add = bindArgs(movePlainDate, false) as (
  plainDateRecord: Record,
  durationRecord: DurationFns.Record,
  options?: ArithmeticOptions,
) => Record

export const subtract = bindArgs(movePlainDate, true) as (
  plainDateRecord: Record,
  durationRecord: DurationFns.Record,
  options?: ArithmeticOptions,
) => Record

export const until = bindArgs(diffPlainDates, false) as (
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
) => DurationFns.Record

export const since = bindArgs(diffPlainDates, true) as (
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
) => DurationFns.Record

export const equals = plainDatesEqual as (
  record0: Record,
  record1: Record,
) => boolean

export function compare(record0: Record, record1: Record): NumberSign {
  return compareIsoDateFields(record0.isoDate, record1.isoDate)
}

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
    (plainTime) => plainTime.time,
    record,
    optionsObj,
  )
}

export function toPlainDateTime(
  plainDateRecord: Record,
  plainTimeRecord?: PlainTimeFns.Record,
): PlainDateTimeFns.Record {
  return createPlainDateTimeFromRefinedFields(
    plainDateRecord.isoDate,
    plainTimeRecord?.time,
    plainDateRecord.calendar,
  )
}

export function toPlainYearMonth(record: Record): PlainYearMonthFns.Record {
  return convertToPlainYearMonth(getCalendarId(record), getFields(record))
}

export function toPlainMonthDay(record: Record): PlainMonthDayFns.Record {
  return convertToPlainMonthDay(getCalendarId(record), getFields(record))
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
  return createRecordFromDateFields(
    moveToDayOfYear(record, dayOfYear, options).isoDate,
    record.calendar,
  )
}

export function withDayOfMonth(
  record: Record,
  dayOfMonth: number,
  options?: OverflowOptions,
): Record {
  return createRecordFromDateFields(
    moveToDayOfMonth(record, dayOfMonth, options).isoDate,
    record.calendar,
  )
}

export function withDayOfWeek(
  record: Record,
  dayOfWeek: number,
  options?: OverflowOptions,
): Record {
  return createRecordFromDateFields(
    moveToDayOfWeek(record, dayOfWeek, options).isoDate,
    record.calendar,
  )
}

export function withWeekOfYear(
  record: Record,
  weekOfYear: number,
  options?: OverflowOptions,
): Record {
  return createRecordFromDateFields(
    slotsWithWeekOfYear(record, weekOfYear, options).isoDate,
    record.calendar,
  )
}

// Non-standard: Move
// -----------------------------------------------------------------------------

export function addYears(
  record: Record,
  years: number,
  options?: OverflowOptions,
): Record {
  return createRecordFromDateFields(
    moveByYears(record, years, options).isoDate,
    record.calendar,
  )
}

export function addMonths(
  record: Record,
  months: number,
  options?: OverflowOptions,
): Record {
  return createRecordFromDateFields(
    moveByMonths(record, months, options).isoDate,
    record.calendar,
  )
}

export function addWeeks(record: Record, weeks: number): Record {
  return createRecordFromDateFields(
    moveByIsoWeeks(record, weeks).isoDate,
    record.calendar,
  )
}

export function addDays(record: Record, days: number): Record {
  return createRecordFromDateFields(
    moveByDaysStrict(record, days).isoDate,
    record.calendar,
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
  computeInterval: (slots: AbstractDateSlots) => IsoDateTimeInterval,
  record0: Record,
  options?: RoundingModeName | RoundingMathOptions,
): Record {
  const [, roundingMode] = refineUnitRoundOptions(unit, options)
  const roundedIsoDateTime = roundDateTimeToInterval(
    computeInterval,
    record0,
    roundingMode,
  )
  return createRecordFromDateFields(
    roundedIsoDateTime.isoDate,
    record0.calendar,
  )
}

function aligned(
  computeAlignment: (slots: AbstractDateSlots) => IsoDateCarrier,
  dayDelta = 0,
): (record: Record) => Record {
  return (record0) => {
    const isoDate = moveByDays(computeAlignment(record0).isoDate, dayDelta)
    return createRecordFromDateFields(isoDate, record0.calendar)
  }
}

function createRecordFromDateFields(
  isoDate: CalendarDateFields,
  calendar: string,
): Record {
  checkIsoDateInBounds(isoDate)
  return createPlainDateSlots(isoDate, calendar)
}
