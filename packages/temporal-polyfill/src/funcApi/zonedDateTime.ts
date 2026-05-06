import { addBigNanos, moveBigNano, numberToBigNano } from '../internal/bigNano'
import { refineCalendarId } from '../internal/calendarId'
import { toStrictInteger } from '../internal/cast'
import { compareZonedDateTimes, zonedDateTimesEqual } from '../internal/compare'
import { constructZonedDateTimeSlots } from '../internal/construct'
import {
  convertToPlainMonthDay,
  convertToPlainYearMonth,
  zonedDateTimeToInstant,
  zonedDateTimeToPlainDate,
  zonedDateTimeToPlainDateTime,
  zonedDateTimeToPlainTime,
} from '../internal/convert'
import { refineZonedDateTimeObjectLike } from '../internal/createFromFields'
import { diffZonedDateTimes, getCommonCalendar } from '../internal/diff'
import { getInternalCalendar } from '../internal/externalCalendar'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  DateTimeFields,
  TimeFields,
  ZonedDateTimeLikeObject,
} from '../internal/fieldTypes'
import { combineDateAndTime } from '../internal/fieldUtils'
import { createFormatPrepper, zonedConfig } from '../internal/intlFormatPrep'
import { LocalesArg } from '../internal/intlFormatUtils'
import { computeIsoDayOfWeek } from '../internal/isoCalendarMath'
import { formatOffsetNano, formatZonedDateTimeIso } from '../internal/isoFormat'
import { parseZonedDateTime } from '../internal/isoParse'
import { mergeZonedDateTimeFields } from '../internal/merge'
import {
  zonedDateTimeWithPlainDate,
  zonedDateTimeWithPlainTime,
} from '../internal/modify'
import { moveZonedDateTime } from '../internal/move'
import {
  DiffOptions,
  DirectionName,
  DirectionOptions,
  OverflowOptions,
  RoundingMathOptions,
  RoundingModeName,
  RoundingOptions,
  ZonedDateTimeDisplayOptions,
  ZonedFieldOptions,
} from '../internal/optionsModel'
import { refineUnitRoundOptions } from '../internal/optionsRoundingRefine'
import {
  IsoDateTimeInterval,
  alignZonedEpoch,
  computeZonedHoursInDay,
  computeZonedStartOfDay,
  roundZonedDateTime,
  roundZonedEpochToInterval,
} from '../internal/round'
import {
  AbstractDateTimeSlots,
  ZonedDateTimeBranding,
  ZonedDateTimeSlots,
  createZonedDateTimeSlots,
  getEpochMicro,
  getEpochMilli,
  getEpochNano,
  getEpochSec,
} from '../internal/slots'
import { checkEpochNanoInBounds } from '../internal/temporalLimits'
import { refineTimeZoneId } from '../internal/timeZoneId'
import { queryTimeZone } from '../internal/timeZoneImpl'
import {
  ZonedDateTimeFields,
  getSingleInstantFor,
  getTimeZoneTransitionEpochNanoseconds,
  zonedEpochSlotsToIso,
} from '../internal/timeZoneMath'
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
  diffZonedDays,
  diffZonedMonths,
  diffZonedTimeUnits,
  diffZonedWeeks,
  diffZonedYears,
} from './diffUtils'
import * as DurationFns from './duration'
import * as InstantFns from './instant'
import { createFormatCache } from './intlFormatCache'
import {
  moveByDaysStrict,
  moveByIsoWeeks,
  moveByMonths,
  moveByYears,
  moveToDayOfMonth,
  moveToDayOfWeek,
  moveToDayOfYear,
  moveToWeekOfYear,
  reversedMove,
} from './moveUtils'
import * as PlainDateFns from './plainDate'
import * as PlainDateTimeFns from './plainDateTime'
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
} from './roundUtils'

export type Record = ZonedDateTimeSlots

export type Fields = ZonedDateTimeFields
export type FromFields = ZonedDateTimeLikeObject
export type WithFields = Partial<DateTimeFields>
export type AssignmentOptions = ZonedFieldOptions
export type ArithmeticOptions = OverflowOptions
export type DifferenceOptions = DiffOptions<UnitName>
export type RoundOptions = RoundingOptions<DayTimeUnitName>
export type ToStringOptions = ZonedDateTimeDisplayOptions

// Creation / Parsing
// -----------------------------------------------------------------------------

export const create = constructZonedDateTimeSlots as (
  epochNanoseconds: bigint,
  timeZoneId: string,
  calendar?: string,
) => Record

export function fromFields(
  fields: FromFields,
  options?: AssignmentOptions,
): Record {
  const calendarId = getCalendarIdFromBag(fields)
  const calendar = getInternalCalendar(calendarId)
  return refineZonedDateTimeObjectLike(
    refineTimeZoneId,
    calendar,
    fields,
    options,
  )
}

export const fromString = parseZonedDateTime as (
  s: string,
  options?: AssignmentOptions,
) => Record

export function isInstance(record: any): record is Record {
  return Boolean(record) && record.branding === ZonedDateTimeBranding
}

// Getters
// -----------------------------------------------------------------------------

// TODO: improve prop mergeing and combining here
export const getFields = memoize((record: Record): Fields => {
  const isoDateTime = zonedEpochSlotsToIso(record)
  const { offsetNanoseconds } = isoDateTime
  const { year, month, day, ...time } = combineDateAndTime(
    isoDateTime,
    isoDateTime,
  )
  const offsetString = formatOffsetNano(offsetNanoseconds)

  return {
    ...computeDateFields({
      calendar: record.calendar,
      year,
      month,
      day,
    }),
    ...time,
    offset: offsetString,
  }
}, WeakMap)

export const epochSeconds = getEpochSec as (record: Record) => number

export const epochMilliseconds = getEpochMilli as (record: Record) => number

export const epochMicroseconds = getEpochMicro as (record: Record) => bigint

export const epochNanoseconds = getEpochNano as (record: Record) => bigint

export function offsetNanoseconds(record: Record): number {
  return zonedEpochSlotsToIso(record).offsetNanoseconds
}

export function offset(record: Record): string {
  return formatOffsetNano(offsetNanoseconds(record))
}

export function dayOfWeek(record: Record): number {
  return computeIsoDayOfWeek(zonedEpochSlotsToIso(record))
}

export const daysInWeek = (() => 7) as (record: Record) => number

export const weekOfYear = adaptDateFunc(computeWeekOfYear) as (
  record: Record,
) => number | undefined

export const yearOfWeek = adaptDateFunc(computeYearOfWeek) as (
  record: Record,
) => number | undefined

export const dayOfYear = adaptDateFunc(computeDayOfYear) as (
  record: Record,
) => number

export const daysInMonth = adaptDateFunc(computeDaysInMonth) as (
  record: Record,
) => number

export const daysInYear = adaptDateFunc(computeDaysInYear) as (
  record: Record,
) => number

export const monthsInYear = adaptDateFunc(computeMonthsInYear) as (
  record: Record,
) => number

export const inLeapYear = adaptDateFunc(computeInLeapYear) as (
  record: Record,
) => boolean

export const hoursInDay = bindArgs(computeZonedHoursInDay) as (
  record: Record,
) => number

// Setters
// -----------------------------------------------------------------------------

export const withFields = mergeZonedDateTimeFields as (
  record: Record,
  fields: WithFields,
  options?: AssignmentOptions,
) => Record

export function withCalendar(record: Record, calendarId: string): Record {
  return createZonedDateTimeSlots(
    record.epochNanoseconds,
    record.timeZone,
    getInternalCalendar(refineCalendarId(calendarId)),
  )
}

export function withTimeZone(record: Record, timeZoneId: string): Record {
  return {
    ...record,
    timeZone: queryTimeZone(refineTimeZoneId(timeZoneId)),
  }
}

export const withPlainDate = bindArgs(zonedDateTimeWithPlainDate) as (
  zonedDateTimeRecord: Record,
  plainDateRecord: PlainDateFns.Record,
) => Record

export function withPlainTime(
  zonedDateTimeRecord: Record,
  plainTimeRecord?: PlainTimeFns.Record,
): Record {
  return zonedDateTimeWithPlainTime(zonedDateTimeRecord, plainTimeRecord)
}

// Math
// -----------------------------------------------------------------------------

export const add = bindArgs(moveZonedDateTime, false) as (
  zonedDateTimeRecord: Record,
  durationRecord: DurationFns.Record,
  options?: ArithmeticOptions,
) => Record

export const subtract = bindArgs(moveZonedDateTime, true) as (
  zonedDateTimeRecord: Record,
  durationRecord: DurationFns.Record,
  options?: ArithmeticOptions,
) => Record

export function until(
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
): DurationFns.Record {
  const calendar = getCommonCalendar(record0.calendar, record1.calendar)
  return diffZonedDateTimes(false, calendar, record0, record1, options)
}

export function since(
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
): DurationFns.Record {
  const calendar = getCommonCalendar(record0.calendar, record1.calendar)
  return diffZonedDateTimes(true, calendar, record0, record1, options)
}

export const round = bindArgs(roundZonedDateTime) as (
  record: Record,
  options: DayTimeUnitName | RoundOptions,
) => Record

export const startOfDay = bindArgs(computeZonedStartOfDay) as (
  record: Record,
) => Record

export function getTimeZoneTransition(
  record: Record,
  options: DirectionOptions | DirectionName,
): Record | null {
  const epochNano = getTimeZoneTransitionEpochNanoseconds(record, options)

  // The transition keeps the same calendar and time-zone identity. Only the
  // represented instant changes to the exact boundary returned by the zone.
  return epochNano ? { ...record, epochNanoseconds: epochNano } : null
}

export const equals = zonedDateTimesEqual as (
  record0: Record,
  record1: Record,
) => boolean

export const compare = compareZonedDateTimes as (
  record0: Record,
  record1: Record,
) => NumberSign

// Conversion
// -----------------------------------------------------------------------------

export const toInstant = zonedDateTimeToInstant as (
  record: Record,
) => InstantFns.Record

export const toPlainDateTime = bindArgs(zonedDateTimeToPlainDateTime) as (
  record: Record,
) => PlainDateTimeFns.Record

export const toPlainDate = bindArgs(zonedDateTimeToPlainDate) as (
  record: Record,
) => PlainDateFns.Record

export const toPlainTime = bindArgs(zonedDateTimeToPlainTime) as (
  record: Record,
) => PlainTimeFns.Record

export function toPlainYearMonth(record: Record): PlainYearMonthFns.Record {
  return convertToPlainYearMonth(record.calendar, getFields(record))
}

export function toPlainMonthDay(record: Record): PlainMonthDayFns.Record {
  return convertToPlainMonthDay(record.calendar, getFields(record))
}

// Formatting
// -----------------------------------------------------------------------------

const prepFormat = createFormatPrepper(
  zonedConfig,
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

export const toString = bindArgs(formatZonedDateTimeIso) as (
  record: Record,
  options?: ToStringOptions,
) => string

// Internal Utils
// -----------------------------------------------------------------------------

function adaptDateFunc<R>(
  dateFunc: (dateSlots: any) => R,
): (record: Record) => R {
  return (record: Record) => {
    const isoDate = zonedEpochSlotsToIso(record)
    return dateFunc({ ...isoDate, calendar: record.calendar })
  }
}

// Non-standard: With
// -----------------------------------------------------------------------------

export const withDayOfYear = zonedTransform(moveToDayOfYear)
export const withDayOfMonth = zonedTransform(moveToDayOfMonth)
export const withDayOfWeek = zonedTransform(moveToDayOfWeek)
export const withWeekOfYear = zonedTransform(moveToWeekOfYear)

// Non-standard: Move
// -----------------------------------------------------------------------------

export const addYears = zonedTransform(moveByYears)
export const addMonths = zonedTransform(moveByMonths)
export const addWeeks = zonedTransform(moveByIsoWeeks)
export const addDays = zonedTransform(moveByDaysStrict)
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

export const diffYears = diffZonedYears
export const diffMonths = diffZonedMonths
export const diffWeeks = diffZonedWeeks
export const diffDays = diffZonedDays

export const diffHours = bindArgs(diffZonedTimeUnits, Unit.Hour, nanoInHour)
export const diffMinutes = bindArgs(
  diffZonedTimeUnits,
  Unit.Minute,
  nanoInMinute,
)
export const diffSeconds = bindArgs(diffZonedTimeUnits, Unit.Second, nanoInSec)
export const diffMilliseconds = bindArgs(
  diffZonedTimeUnits,
  Unit.Millisecond,
  nanoInMilli,
)
export const diffMicroseconds = bindArgs(
  diffZonedTimeUnits,
  Unit.Microsecond,
  nanoInMicro,
)
export const diffNanoseconds = bindArgs(diffZonedTimeUnits, Unit.Nanosecond, 1)

// Non-standard: Utils
// -----------------------------------------------------------------------------

function moveByTimeUnit(
  nanoInUnit: number,
  record: Record,
  units: number,
): Record {
  const epochNano1 = addBigNanos(
    record.epochNanoseconds,
    numberToBigNano(toStrictInteger(units), nanoInUnit),
  )
  return {
    ...record,
    epochNanoseconds: checkEpochNanoInBounds(epochNano1),
  }
}

function roundToInterval(
  unit: Unit,
  computeInterval: (slots: any) => IsoDateTimeInterval,
  record: Record,
  options?: RoundingModeName | RoundingMathOptions,
): Record {
  const [, roundingMode] = refineUnitRoundOptions(unit, options)
  const epochNano1 = roundZonedEpochToInterval(
    computeInterval,
    record.timeZone,
    record,
    roundingMode,
  )
  return {
    ...record,
    epochNanoseconds: checkEpochNanoInBounds(epochNano1),
  }
}

function aligned(
  computeAlignment: (record: AbstractDateTimeSlots) => CalendarDateTimeFields,
  nanoDelta = 0,
): (record: Record) => Record {
  return (record) => {
    const epochNano1 = moveBigNano(
      alignZonedEpoch(computeAlignment, record.timeZone, record),
      nanoDelta,
    )
    return {
      ...record,
      epochNanoseconds: checkEpochNanoInBounds(epochNano1),
    }
  }
}

function alignedTime(
  computeAlignment: (time: TimeFields) => TimeFields,
): (slots: AbstractDateTimeSlots) => CalendarDateTimeFields {
  return (slots) => combineDateAndTime(slots, computeAlignment(slots))
}

function zonedTransform<A extends any[]>(
  transformIsoDate: (isoDate: any, ...args: A) => CalendarDateFields,
): (record: Record, ...args: A) => Record {
  return (record, ...args) => {
    const { timeZone } = record
    const isoDateTime = zonedEpochSlotsToIso(record, timeZone)
    const isoDate = transformIsoDate(isoDateTime, ...args)
    // These transforms are date-only operations. Preserve the original
    // wall-clock time while allowing the transform to replace the ISO date.
    const epochNano1 = getSingleInstantFor(
      timeZone,
      combineDateAndTime(isoDate, isoDateTime),
    )
    return {
      ...record,
      epochNanoseconds: checkEpochNanoInBounds(epochNano1),
    }
  }
}
