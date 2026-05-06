import { addBigNanos, numberToBigNano } from '../internal/bigNano'
import { refineCalendarId } from '../internal/calendarId'
import { toStrictInteger } from '../internal/cast'
import {
  compareIsoDateTimeFields,
  plainDateTimesEqual,
} from '../internal/compare'
import { constructPlainDateTimeSlots } from '../internal/construct'
import {
  convertToPlainMonthDay,
  convertToPlainYearMonth,
  plainDateTimeToZonedDateTime,
} from '../internal/convert'
import { refinePlainDateTimeObjectLike } from '../internal/createFromFields'
import { diffPlainDateTimes, getCommonCalendar } from '../internal/diff'
import { getInternalCalendar } from '../internal/externalCalendar'
import { timeFieldDefaults } from '../internal/fieldNames'
import {
  CalendarDateTimeFields,
  DateTimeFields,
  DateTimeLikeObject,
  TimeFields,
} from '../internal/fieldTypes'
import { combineDateAndTime } from '../internal/fieldUtils'
import { createFormatPrepper, dateTimeConfig } from '../internal/intlFormatPrep'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatPlainDateTimeIso } from '../internal/isoFormat'
import { computeIsoDayOfWeek } from '../internal/isoMath'
import { parsePlainDateTime } from '../internal/isoParse'
import { mergePlainDateTimeFields } from '../internal/merge'
import {
  plainDateTimeWithPlainDate,
  slotsWithCalendar,
} from '../internal/modify'
import { movePlainDateTime } from '../internal/move'
import {
  DateTimeDisplayOptions,
  DiffOptions,
  EpochDisambigOptions,
  OverflowOptions,
  RoundingMathOptions,
  RoundingModeName,
  RoundingOptions,
} from '../internal/optionsModel'
import { refineUnitRoundOptions } from '../internal/optionsRoundingRefine'
import {
  IsoDateTimeInterval,
  computeDayFloor,
  roundPlainDateTime,
} from '../internal/round'
import {
  AbstractDateSlots,
  PlainDateTimeBranding,
  PlainDateTimeSlots,
  createPlainDateSlots,
  createPlainTimeSlots,
} from '../internal/slots'
import { createPlainDateTimeFromRefinedFields } from '../internal/slotsFromRefinedFields'
import { epochNanoToIso, isoDateTimeToEpochNano } from '../internal/timeMath'
import { refineTimeZoneId } from '../internal/timeZoneId'
import { queryTimeZone } from '../internal/timeZoneImpl'
import {
  DayTimeUnitName,
  Unit,
  UnitName,
  nanoInHour,
  nanoInMicro,
  nanoInMilli,
  nanoInMinute,
  nanoInSec,
} from '../internal/units'
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
  getCalendarIdFromBag,
} from './calendarUtils'
import {
  diffPlainDays,
  diffPlainMonths,
  diffPlainTimeUnits,
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
import * as PlainDateFns from './plainDate'
import * as PlainMonthDayFns from './plainMonthDay'
import * as PlainTimeFns from './plainTime'
import * as PlainYearMonthFns from './plainYearMonth'
import {
  computeDayCeil,
  computeHourFloor,
  computeIsoWeekCeil,
  computeIsoWeekFloor,
  computeIsoWeekInterval,
  computeMicroFloor,
  computeMilliFloor,
  computeMinuteFloor,
  computeMonthCeil,
  computeMonthFloor,
  computeMonthInterval,
  computeSecFloor,
  computeYearCeil,
  computeYearFloor,
  computeYearInterval,
  roundDateTimeToInterval,
} from './roundUtils'
import * as ZonedDateTimeFns from './zonedDateTime'

export type Record = PlainDateTimeSlots

export type Fields = DateTimeFields
export type FromFields = DateTimeLikeObject
export type WithFields = Partial<DateTimeFields>
export type AssignmentOptions = OverflowOptions
export type ArithmeticOptions = OverflowOptions
export type DifferenceOptions = DiffOptions<UnitName>
export type RoundOptions = RoundingOptions<DayTimeUnitName>
export type ToZonedDateTimeOptions = EpochDisambigOptions
export type ToStringOptions = DateTimeDisplayOptions

// Creation / Parsing
// -----------------------------------------------------------------------------

export const create = constructPlainDateTimeSlots as (
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  hour?: number,
  minute?: number,
  second?: number,
  millisecond?: number,
  microsecond?: number,
  nanosecond?: number,
  calendar?: string,
) => Record

export function fromFields(
  fields: FromFields,
  options?: AssignmentOptions,
): Record {
  const calendarId = getCalendarIdFromBag(fields)
  const calendar = getInternalCalendar(calendarId)
  return refinePlainDateTimeObjectLike(calendar, fields, options)
}

export const fromString = parsePlainDateTime as (s: string) => Record

export function isInstance(record: any): record is Record {
  return Boolean(record) && record.branding === PlainDateTimeBranding
}

// Getters
// -----------------------------------------------------------------------------

export const getFields = memoize((record: Record): Fields => {
  const {
    year: _year,
    month: _month,
    day: _day,
    ...time
  } = combineDateAndTime(record, record)
  return {
    ...computeDateFields(record), // contains era/eraYear/monthCode
    ...time, // the _* fields basically plucked
  }
}, WeakMap)

export const dayOfWeek = computeIsoDayOfWeek as (record: Record) => number

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
  return mergePlainDateTimeFields(record.calendar, record, fields, options)
}

export function withCalendar(record: Record, calendarId: string): Record {
  return slotsWithCalendar(
    record,
    getInternalCalendar(refineCalendarId(calendarId)),
  )
}

export const withPlainDate = plainDateTimeWithPlainDate as (
  plainDateTimeRecord: Record,
  plainDateRecord: PlainDateFns.Record,
) => Record

export function withPlainTime(
  plainDateTimeRecord: Record,
  plainTimeRecord: PlainTimeFns.Record | TimeFields = timeFieldDefaults,
): Record {
  return createPlainDateTimeFromRefinedFields(
    plainDateTimeRecord,
    plainTimeRecord,
    plainDateTimeRecord.calendar,
  )
}

// Math
// -----------------------------------------------------------------------------

export const add = bindArgs(movePlainDateTime, false) as (
  plainDateTimeRecord: Record,
  durationRecord: DurationFns.Record,
  options?: ArithmeticOptions,
) => Record

export const subtract = bindArgs(movePlainDateTime, true) as (
  plainDateTimeRecord: Record,
  durationRecord: DurationFns.Record,
  options?: ArithmeticOptions,
) => Record

export function until(
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
): DurationFns.Record {
  const calendar = getCommonCalendar(record0.calendar, record1.calendar)
  return diffPlainDateTimes(false, calendar, record0, record1, options)
}

export function since(
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
): DurationFns.Record {
  const calendar = getCommonCalendar(record0.calendar, record1.calendar)
  return diffPlainDateTimes(true, calendar, record0, record1, options)
}

export const round = roundPlainDateTime as (
  record: Record,
  options: DayTimeUnitName | RoundOptions,
) => Record

export const equals = plainDateTimesEqual as (
  record0: Record,
  record1: Record,
) => boolean

export const compare = compareIsoDateTimeFields as (
  record0: Record,
  record1: Record,
) => NumberSign

// Conversion
// -----------------------------------------------------------------------------

export function toZonedDateTime(
  record: Record,
  timeZoneId: string,
  options?: ToZonedDateTimeOptions,
): ZonedDateTimeFns.Record {
  return plainDateTimeToZonedDateTime(
    record,
    queryTimeZone(refineTimeZoneId(timeZoneId)),
    options,
  )
}

export function toPlainDate(record: Record): PlainDateFns.Record {
  return createPlainDateSlots(record, record.calendar)
}

export function toPlainTime(record: Record): PlainTimeFns.Record {
  return createPlainTimeSlots(record)
}

export function toPlainYearMonth(record: Record): PlainYearMonthFns.Record {
  return convertToPlainYearMonth(record.calendar, getFields(record))
}

export function toPlainMonthDay(record: Record): PlainMonthDayFns.Record {
  return convertToPlainMonthDay(record.calendar, getFields(record))
}

// Formatting
// -----------------------------------------------------------------------------

const prepFormat = createFormatPrepper(
  dateTimeConfig,
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

export const toString = formatPlainDateTimeIso as (
  record: Record,
  options?: ToStringOptions,
) => string

// Non-standard: With
// -----------------------------------------------------------------------------
// No need for createPlainDateTimeSlots because move* utils return self

export function withDayOfYear(
  record: Record,
  dayOfYear: number,
  options?: OverflowOptions,
): Record {
  const { calendar } = record
  return createPlainDateTimeFromRefinedFields(
    moveToDayOfYear(calendar, record, dayOfYear, options),
    record,
    calendar,
  )
}

export function withDayOfMonth(
  record: Record,
  dayOfMonth: number,
  options?: OverflowOptions,
): Record {
  const { calendar } = record
  return createPlainDateTimeFromRefinedFields(
    moveToDayOfMonth(calendar, record, dayOfMonth, options),
    record,
    calendar,
  )
}

export function withDayOfWeek(
  record: Record,
  dayOfWeek: number,
  options?: OverflowOptions,
): Record {
  const { calendar } = record
  return createPlainDateTimeFromRefinedFields(
    moveToDayOfWeek(calendar, record, dayOfWeek, options),
    record,
    calendar,
  )
}

export function withWeekOfYear(
  record: Record,
  weekOfYear: number,
  options?: OverflowOptions,
): Record {
  const { calendar } = record
  return createPlainDateTimeFromRefinedFields(
    slotsWithWeekOfYear(calendar, record, weekOfYear, options),
    record,
    calendar,
  )
}

// Non-standard: Add
// -----------------------------------------------------------------------------

export function addYears(
  record: Record,
  years: number,
  options?: OverflowOptions,
): Record {
  const { calendar } = record
  return createPlainDateTimeFromRefinedFields(
    moveByYears(calendar, record, years, options),
    record,
    calendar,
  )
}

export function addMonths(
  record: Record,
  months: number,
  options?: OverflowOptions,
): Record {
  const { calendar } = record
  return createPlainDateTimeFromRefinedFields(
    moveByMonths(calendar, record, months, options),
    record,
    calendar,
  )
}

export function addWeeks(record: Record, weeks: number): Record {
  const { calendar } = record
  return createPlainDateTimeFromRefinedFields(
    moveByIsoWeeks(calendar, record, weeks),
    record,
    calendar,
  )
}

export function addDays(record: Record, days: number): Record {
  const { calendar } = record
  return createPlainDateTimeFromRefinedFields(
    moveByDaysStrict(calendar, record, days),
    record,
    calendar,
  )
}

export const addHours = bindArgs(moveByTimeUnit, nanoInHour)
export const addMinutes = bindArgs(moveByTimeUnit, nanoInMinute)
export const addSeconds = bindArgs(moveByTimeUnit, nanoInSec)
export const addMilliseconds = bindArgs(moveByTimeUnit, nanoInMilli)
export const addMicroseconds = bindArgs(moveByTimeUnit, nanoInMicro)
export const addNanoseconds = bindArgs(moveByTimeUnit, 1)

// Non-standard: Subtract
// -----------------------------------------------------------------------------

export const subtractYears = reversedMove(addYears)
export const subtractMonths = reversedMove(addMonths)
export const subtractWeeks = reversedMove(addWeeks)
export const subtractDays = reversedMove(addDays)
export const subtractHours = reversedMove(addHours)
export const subtractMinutes = reversedMove(addMinutes)
export const subtractSeconds = reversedMove(addSeconds)
export const subtractMilliseconds = reversedMove(addMilliseconds)
export const subtractMicroseconds = reversedMove(addMicroseconds)
export const subtractNanoseconds = reversedMove(addNanoseconds)

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
export const startOfDay = aligned(computeDayFloor)
export const startOfHour = aligned(alignedTime(computeHourFloor))
export const startOfMinute = aligned(alignedTime(computeMinuteFloor))
export const startOfSecond = aligned(alignedTime(computeSecFloor))
export const startOfMillisecond = aligned(alignedTime(computeMilliFloor))
export const startOfMicrosecond = aligned(alignedTime(computeMicroFloor))

// Non-standard: End-of-Unit
// -----------------------------------------------------------------------------

export const endOfYear = aligned(computeYearCeil, -1)
export const endOfMonth = aligned(computeMonthCeil, -1)
export const endOfWeek = aligned(computeIsoWeekCeil, -1)
export const endOfDay = aligned(computeDayCeil, -1)
export const endOfHour = aligned(alignedTime(computeHourFloor), nanoInHour - 1)
export const endOfMinute = aligned(
  alignedTime(computeMinuteFloor),
  nanoInMinute - 1,
)
export const endOfSecond = aligned(alignedTime(computeSecFloor), nanoInSec - 1)
export const endOfMillisecond = aligned(
  alignedTime(computeMilliFloor),
  nanoInMilli - 1,
)
export const endOfMicrosecond = aligned(
  alignedTime(computeMicroFloor),
  nanoInMicro - 1,
)

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

export const diffHours = bindArgs(diffPlainTimeUnits, Unit.Hour, nanoInHour)

export const diffMinutes = bindArgs(
  diffPlainTimeUnits,
  Unit.Minute,
  nanoInMinute,
)

export const diffSeconds = bindArgs(diffPlainTimeUnits, Unit.Second, nanoInSec)

export const diffMilliseconds = bindArgs(
  diffPlainTimeUnits,
  Unit.Millisecond,
  nanoInMilli,
)

export const diffMicroseconds = bindArgs(
  diffPlainTimeUnits,
  Unit.Microsecond,
  nanoInMicro,
)

export const diffNanoseconds = bindArgs(diffPlainTimeUnits, Unit.Nanosecond, 1)

// Non-standard: Utils
// -----------------------------------------------------------------------------

function moveByTimeUnit(
  nanoInUnit: number,
  record: Record,
  units: number,
): Record {
  const epochNano0 = isoDateTimeToEpochNano(record)!
  const epochNano1 = addBigNanos(
    epochNano0,
    numberToBigNano(toStrictInteger(units), nanoInUnit),
  )
  const isoDateTime1 = epochNanoToIso(epochNano1, 0)

  return createPlainDateTimeFromRefinedFields(
    isoDateTime1,
    isoDateTime1,
    record.calendar,
  )
}

function roundToInterval(
  unit: Unit,
  computeInterval: (slots: AbstractDateSlots) => IsoDateTimeInterval,
  record: Record,
  options?: RoundingModeName | RoundingMathOptions,
): Record {
  const [, roundingMode] = refineUnitRoundOptions(unit, options)

  const isoDateTime = roundDateTimeToInterval(
    computeInterval,
    record,
    roundingMode,
  )
  return createPlainDateTimeFromRefinedFields(
    isoDateTime,
    isoDateTime,
    record.calendar,
  )
}

function aligned(
  computeAlignment: (slots: Record) => CalendarDateTimeFields,
  nanoDelta = 0,
): (record: Record) => Record {
  return (record0) => {
    let isoDateTime = computeAlignment(record0)

    if (nanoDelta) {
      isoDateTime = epochNanoToIso(
        isoDateTimeToEpochNano(isoDateTime)!,
        nanoDelta,
      )
    }

    return createPlainDateTimeFromRefinedFields(
      isoDateTime,
      isoDateTime,
      record0.calendar,
    )
  }
}

function alignedTime(
  computeAlignment: (time: TimeFields) => TimeFields,
): (slots: Record) => CalendarDateTimeFields {
  return (slots) => combineDateAndTime(slots, computeAlignment(slots))
}
