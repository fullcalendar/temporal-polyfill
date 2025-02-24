import {
  ZonedDateTimeBag,
  isoTimeFieldsToCal,
  refineZonedDateTimeBag,
  zonedDateTimeWithFields,
} from '../internal/bagRefine'
import {
  BigNano,
  addBigNanos,
  moveBigNano,
  numberToBigNano,
} from '../internal/bigNano'
import { refineCalendarId } from '../internal/calendarId'
import {
  createNativeDateModOps,
  createNativeDateRefineOps,
  createNativeDiffOps,
  createNativeMonthDayRefineOps,
  createNativeMoveOps,
  createNativeYearMonthRefineOps,
} from '../internal/calendarNativeQuery'
import { toStrictInteger } from '../internal/cast'
import { compareZonedDateTimes, zonedDateTimesEqual } from '../internal/compare'
import { constructZonedDateTimeSlots } from '../internal/construct'
import {
  zonedDateTimeToInstant,
  zonedDateTimeToPlainDate,
  zonedDateTimeToPlainDateTime,
  zonedDateTimeToPlainMonthDay,
  zonedDateTimeToPlainTime,
  zonedDateTimeToPlainYearMonth,
} from '../internal/convert'
import { diffZonedDateTimes } from '../internal/diff'
import { DateTimeBag } from '../internal/fields'
import { createFormatPrepper, zonedConfig } from '../internal/intlFormatPrep'
import { LocalesArg } from '../internal/intlFormatUtils'
import { IsoDateTimeFields } from '../internal/isoFields'
import { formatOffsetNano, formatZonedDateTimeIso } from '../internal/isoFormat'
import { computeIsoDayOfWeek, computeIsoDaysInWeek } from '../internal/isoMath'
import { parseZonedDateTime } from '../internal/isoParse'
import {
  slotsWithCalendarId,
  slotsWithTimeZoneId,
  zonedDateTimeWithPlainDate,
  zonedDateTimeWithPlainTime,
} from '../internal/modify'
import { moveZonedDateTime } from '../internal/move'
import {
  DiffOptions,
  OverflowOptions,
  RoundingMathOptions,
  RoundingModeName,
  RoundingOptions,
  ZonedDateTimeDisplayOptions,
  ZonedFieldOptions,
  refineUnitRoundOptions,
} from '../internal/optionsRefine'
import {
  IsoDateTimeInterval,
  alignZonedEpoch,
  computeDayFloor,
  computeZonedHoursInDay,
  computeZonedStartOfDay,
  roundZonedDateTime,
  roundZonedEpochToInterval,
} from '../internal/round'
import {
  DateSlots,
  DateTimeSlots,
  ZonedDateTimeBranding,
  getEpochMicro,
  getEpochMilli,
  getEpochNano,
  getEpochSec,
} from '../internal/slots'
import { checkEpochNanoInBounds } from '../internal/timeMath'
import { refineTimeZoneId } from '../internal/timeZoneId'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import {
  ZonedDateTimeFields,
  ZonedIsoFields,
  buildZonedIsoFields,
  getSingleInstantFor,
  zonedEpochSlotsToIso,
} from '../internal/timeZoneOps'
import {
  DayTimeUnitName,
  Unit,
  UnitName,
  nanoInHour,
  nanoInMicro,
  nanoInMilli,
  nanoInMinute,
  nanoInSec,
  nanoInUtcDay,
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
  getCalendarId,
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
  reversedMove,
  slotsWithWeekOfYear,
} from './moveUtils'
import * as PlainDateFns from './plainDate'
import * as PlainDateTimeFns from './plainDateTime'
import * as PlainMonthDayFns from './plainMonthDay'
import * as PlainTimeFns from './plainTime'
import * as PlainYearMonthFns from './plainYearMonth'
import {
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

export type Record = {
  /**
   * @deprecated Use the isInstance() function instead.
   */
  readonly branding: typeof ZonedDateTimeBranding

  /**
   * @deprecated Use the calendarId() function instead.
   */
  readonly calendar: string

  /**
   * @deprecated Use the timeZoneId() function instead.
   */
  readonly timeZone: string

  /**
   * @deprecated Use the epochNanoseconds() function instead.
   */
  readonly epochNanoseconds: BigNano
}

export type Fields = ZonedDateTimeFields
export type FromFields = ZonedDateTimeBag
export type WithFields = DateTimeBag
export type ISOFields = ZonedIsoFields

export type AssignmentOptions = ZonedFieldOptions
export type ArithmeticOptions = OverflowOptions
export type DifferenceOptions = DiffOptions<UnitName>
export type RoundOptions = RoundingOptions<DayTimeUnitName>
export type ToStringOptions = ZonedDateTimeDisplayOptions

// Creation / Parsing
// -----------------------------------------------------------------------------

export const create = bindArgs(
  constructZonedDateTimeSlots,
  refineCalendarId,
  refineTimeZoneId,
) as (epochNanoseconds: bigint, timeZone: string, calendar?: string) => Record

export function fromFields(
  fields: FromFields,
  options?: AssignmentOptions,
): Record {
  const calendarId = getCalendarIdFromBag(fields)
  return refineZonedDateTimeBag(
    refineTimeZoneId,
    queryNativeTimeZone,
    createNativeDateRefineOps(calendarId),
    calendarId,
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

export const getFields = memoize((record: Record): Fields => {
  const isoFields = zonedEpochSlotsToIso(record, queryNativeTimeZone)
  const offsetString = formatOffsetNano(isoFields.offsetNanoseconds)

  return {
    ...computeDateFields(isoFields),
    ...isoTimeFieldsToCal(isoFields),
    offset: offsetString,
  }
}, WeakMap)

export const getISOFields = bindArgs(
  buildZonedIsoFields,
  queryNativeTimeZone,
) as (record: Record) => ISOFields

export const calendarId = getCalendarId as (record: Record) => string

export function timeZoneId(record: Record): string {
  return record.timeZone
}

export const epochSeconds = getEpochSec as (record: Record) => number

export const epochMilliseconds = getEpochMilli as (record: Record) => number

export const epochMicroseconds = getEpochMicro as (record: Record) => bigint

export const epochNanoseconds = getEpochNano as (record: Record) => bigint

export function offsetNanoseconds(record: Record): number {
  return zonedEpochSlotsToIso(record, queryNativeTimeZone).offsetNanoseconds
}

export function offset(record: Record): string {
  return formatOffsetNano(offsetNanoseconds(record))
}

export const dayOfWeek = adaptDateFunc(computeIsoDayOfWeek) as (
  record: Record,
) => number

export const daysInWeek = adaptDateFunc(computeIsoDaysInWeek) as (
  record: Record,
) => number

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

export const hoursInDay = bindArgs(
  computeZonedHoursInDay,
  queryNativeTimeZone,
) as (record: Record) => number

// Setters
// -----------------------------------------------------------------------------

export function withFields(
  record: Record,
  fields: WithFields,
  options?: AssignmentOptions,
): Record {
  return zonedDateTimeWithFields(
    createNativeDateModOps,
    queryNativeTimeZone,
    record,
    getFields(record),
    fields,
    options,
  )
}

export function withCalendar(record: Record, calendar: string): Record {
  return slotsWithCalendarId(record, refineCalendarId(calendar))
}

export function withTimeZone(record: Record, timeZone: string): Record {
  return slotsWithTimeZoneId(record, refineTimeZoneId(timeZone))
}

export const withPlainDate = bindArgs(
  zonedDateTimeWithPlainDate,
  queryNativeTimeZone,
) as (
  zonedDateTimeRecord: Record,
  plainDateRecord: PlainDateFns.Record,
) => Record

export const withPlainTime = bindArgs(
  zonedDateTimeWithPlainTime,
  queryNativeTimeZone,
) as (
  zonedDateTimeRecord: Record,
  plainTimeRecord?: PlainTimeFns.Record,
) => Record

// Math
// -----------------------------------------------------------------------------

export const add = bindArgs(
  moveZonedDateTime,
  createNativeMoveOps,
  queryNativeTimeZone,
  false,
) as (
  zonedDateTimeRecord: Record,
  durationRecord: DurationFns.Record,
  options?: ArithmeticOptions,
) => Record

export const subtract = bindArgs(
  moveZonedDateTime,
  createNativeMoveOps,
  queryNativeTimeZone,
  true,
) as (
  zonedDateTimeRecord: Record,
  durationRecord: DurationFns.Record,
  options?: ArithmeticOptions,
) => Record

export const until = bindArgs(
  diffZonedDateTimes,
  createNativeDiffOps,
  queryNativeTimeZone,
  false,
) as (
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
) => DurationFns.Record

export const since = bindArgs(
  diffZonedDateTimes,
  createNativeDiffOps,
  queryNativeTimeZone,
  true,
) as (
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
) => DurationFns.Record

export const round = bindArgs(roundZonedDateTime, queryNativeTimeZone) as (
  record: Record,
  options: DayTimeUnitName | RoundOptions,
) => Record

export const startOfDay = bindArgs(
  computeZonedStartOfDay,
  queryNativeTimeZone,
) as (record: Record) => Record

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

export const toPlainDateTime = bindArgs(
  zonedDateTimeToPlainDateTime,
  queryNativeTimeZone,
) as (record: Record) => PlainDateTimeFns.Record

export const toPlainDate = bindArgs(
  zonedDateTimeToPlainDate,
  queryNativeTimeZone,
) as (record: Record) => PlainDateFns.Record

export const toPlainTime = bindArgs(
  zonedDateTimeToPlainTime,
  queryNativeTimeZone,
) as (record: Record) => PlainTimeFns.Record

export function toPlainYearMonth(record: Record): PlainYearMonthFns.Record {
  return zonedDateTimeToPlainYearMonth(
    createNativeYearMonthRefineOps,
    record,
    getFields(record),
  )
}

export function toPlainMonthDay(record: Record): PlainMonthDayFns.Record {
  return zonedDateTimeToPlainMonthDay(
    createNativeMonthDayRefineOps,
    record,
    getFields(record),
  )
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

export const toString = bindArgs(
  formatZonedDateTimeIso,
  queryNativeTimeZone,
) as (record: Record, options?: ToStringOptions) => string

// Internal Utils
// -----------------------------------------------------------------------------

function adaptDateFunc<R>(
  dateFunc: (dateSlots: DateSlots) => R,
): (record: Record) => R {
  return (record: Record) => {
    return dateFunc(zonedEpochSlotsToIso(record, queryNativeTimeZone))
  }
}

// Non-standard: With
// -----------------------------------------------------------------------------

export const withDayOfYear = zonedTransform(moveToDayOfYear)
export const withDayOfMonth = zonedTransform(moveToDayOfMonth)
export const withDayOfWeek = zonedTransform(moveToDayOfWeek)
export const withWeekOfYear = zonedTransform(slotsWithWeekOfYear)

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
  rountToInterval,
  Unit.Year,
  computeYearInterval,
)

export const roundToMonth = bindArgs(
  rountToInterval,
  Unit.Month,
  computeMonthInterval,
)

export const roundToWeek = bindArgs(
  rountToInterval,
  Unit.Week,
  computeIsoWeekInterval,
)

// Non-standard: Start-of-Unit
// -----------------------------------------------------------------------------

export const startOfYear = aligned(computeYearFloor)
export const startOfMonth = aligned(computeMonthFloor)
export const startOfWeek = aligned(computeIsoWeekFloor)
export const startOfHour = aligned(computeHourFloor)
export const startOfMinute = aligned(computeMinuteFloor)
export const startOfSecond = aligned(computeSecFloor)
export const startOfMillisecond = aligned(computeMilliFloor)
export const startOfMicrosecond = aligned(computeMicroFloor)

// Non-standard: End-of-Unit
// -----------------------------------------------------------------------------

export const endOfYear = aligned(computeYearCeil, -1)
export const endOfMonth = aligned(computeMonthCeil, -1)
export const endOfWeek = aligned(computeIsoWeekCeil, -1)
export const endOfDay = aligned(computeDayFloor, nanoInUtcDay - 1)
export const endOfHour = aligned(computeHourFloor, nanoInHour - 1)
export const endOfMinute = aligned(computeMinuteFloor, nanoInMinute - 1)
export const endOfSecond = aligned(computeSecFloor, nanoInSec - 1)
export const endOfMillisecond = aligned(computeMilliFloor, nanoInMilli - 1)
export const endOfMicrosecond = aligned(computeMicroFloor, nanoInMicro - 1)

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

function rountToInterval(
  unit: Unit,
  computeInterval: (isoFields: DateSlots) => IsoDateTimeInterval,
  record: Record,
  options?: RoundingModeName | RoundingMathOptions,
): Record {
  const [, roundingMode] = refineUnitRoundOptions(unit, options)
  const timeZoneOps = queryNativeTimeZone(record.timeZone)
  const epochNano1 = roundZonedEpochToInterval(
    computeInterval,
    timeZoneOps,
    record,
    roundingMode,
  )
  return {
    ...record,
    epochNanoseconds: checkEpochNanoInBounds(epochNano1),
  }
}

function aligned(
  computeAlignment: (record: DateTimeSlots) => IsoDateTimeFields,
  nanoDelta = 0,
): (record: Record) => Record {
  return (record) => {
    const timeZoneOps = queryNativeTimeZone(record.timeZone)
    const epochNano1 = moveBigNano(
      alignZonedEpoch(computeAlignment, timeZoneOps, record),
      nanoDelta,
    )
    return {
      ...record,
      epochNanoseconds: checkEpochNanoInBounds(epochNano1),
    }
  }
}

function zonedTransform<A extends any[]>(
  transformIso: (isoSlots: DateTimeSlots, ...args: A) => IsoDateTimeFields,
): (record: Record, ...args: A) => Record {
  return (record, ...args) => {
    const timeZoneOps = queryNativeTimeZone(record.timeZone)
    const isoSlots = zonedEpochSlotsToIso(record, timeZoneOps)
    const transformedIsoSlots = transformIso(isoSlots, ...args)
    const epochNano1 = getSingleInstantFor(timeZoneOps, transformedIsoSlots)
    return {
      ...record,
      epochNanoseconds: checkEpochNanoInBounds(epochNano1),
    }
  }
}
