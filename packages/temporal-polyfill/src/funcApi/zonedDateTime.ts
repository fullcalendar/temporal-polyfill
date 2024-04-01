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
  slotsWithCalendar,
  slotsWithTimeZone,
  zonedDateTimeWithPlainDate,
  zonedDateTimeWithPlainTime,
} from '../internal/modify'
import { moveByDays, moveZonedDateTime } from '../internal/move'
import {
  DiffOptions,
  OverflowOptions,
  RoundingMathOptions,
  RoundingModeName,
  RoundingOptions,
  ZonedDateTimeDisplayOptions,
  ZonedFieldOptions,
  refineRoundingMathOptions,
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
  createZonedDateTimeSlots,
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
export type FromFields = ZonedDateTimeBag<string, string>
export type WithFields = DateTimeBag
export type ISOFields = ZonedIsoFields<string, string>

export type AssignmentOptions = ZonedFieldOptions
export type ArithmeticOptions = OverflowOptions
export type DifferenceOptions = DiffOptions<UnitName>
export type RoundOptions = RoundingOptions<DayTimeUnitName>
export type ToStringOptions = ZonedDateTimeDisplayOptions

// Creation / Parsing
// -----------------------------------------------------------------------------

export const create = bindArgs(
  constructZonedDateTimeSlots<string, string, string, string>,
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
  buildZonedIsoFields<string, string>,
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
  computeZonedHoursInDay<string, string>,
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
  return slotsWithCalendar(record, refineCalendarId(calendar))
}

export function withTimeZone(record: Record, timeZone: string): Record {
  return slotsWithTimeZone(record, refineTimeZoneId(timeZone))
}

export const withPlainDate = bindArgs(
  zonedDateTimeWithPlainDate<string, string>,
  queryNativeTimeZone,
) as (
  zonedDateTimeRecord: Record,
  plainDateRecord: PlainDateFns.Record,
) => Record

export const withPlainTime = bindArgs(
  zonedDateTimeWithPlainTime<string, string>,
  queryNativeTimeZone,
) as (
  zonedDateTimeRecord: Record,
  plainTimeRecord?: PlainTimeFns.Record,
) => Record

// Math
// -----------------------------------------------------------------------------

export const add = bindArgs(
  moveZonedDateTime<string, string>,
  createNativeMoveOps,
  queryNativeTimeZone,
  false,
) as (
  zonedDateTimeRecord: Record,
  durationRecord: DurationFns.Record,
  options?: ArithmeticOptions,
) => Record

export const subtract = bindArgs(
  moveZonedDateTime<string, string>,
  createNativeMoveOps,
  queryNativeTimeZone,
  true,
) as (
  zonedDateTimeRecord: Record,
  durationRecord: DurationFns.Record,
  options?: ArithmeticOptions,
) => Record

export const until = bindArgs(
  diffZonedDateTimes<string, string>,
  createNativeDiffOps,
  queryNativeTimeZone,
  false,
) as (
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
) => DurationFns.Record

export const since = bindArgs(
  diffZonedDateTimes<string, string>,
  createNativeDiffOps,
  queryNativeTimeZone,
  true,
) as (
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
) => DurationFns.Record

export const round = bindArgs(
  roundZonedDateTime<string, string>,
  queryNativeTimeZone,
) as (record: Record, options: DayTimeUnitName | RoundOptions) => Record

export const startOfDay = bindArgs(
  computeZonedStartOfDay<string, string>,
  queryNativeTimeZone,
) as (record: Record) => Record

export const equals = zonedDateTimesEqual<string, string> as (
  record0: Record,
  record1: Record,
) => boolean

export const compare = compareZonedDateTimes<string, string> as (
  record0: Record,
  record1: Record,
) => NumberSign

// Conversion
// -----------------------------------------------------------------------------

export const toInstant = zonedDateTimeToInstant as (
  record: Record,
) => InstantFns.Record

export const toPlainDateTime = bindArgs(
  zonedDateTimeToPlainDateTime<string, string>,
  queryNativeTimeZone,
) as (record: Record) => PlainDateTimeFns.Record

export const toPlainDate = bindArgs(
  zonedDateTimeToPlainDate<string, string>,
  queryNativeTimeZone,
) as (record: Record) => PlainDateFns.Record

export const toPlainTime = bindArgs(
  zonedDateTimeToPlainTime<string, string>,
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
  formatZonedDateTimeIso<string, string>,
  queryNativeTimeZone,
) as (record: Record, options?: ToStringOptions) => string

// Internal Utils
// -----------------------------------------------------------------------------

function adaptDateFunc<R>(
  dateFunc: (dateSlots: DateSlots<string>) => R,
): (record: Record) => R {
  return (record: Record) => {
    return dateFunc(zonedEpochSlotsToIso(record, queryNativeTimeZone))
  }
}

// Non-standard: With
// -----------------------------------------------------------------------------

export const withDayOfYear = bindArgs(slotsWithTransform, moveToDayOfYear)
export const withDayOfMonth = bindArgs(slotsWithTransform, moveToDayOfMonth)
export const withDayOfWeek = bindArgs(slotsWithTransform, moveToDayOfWeek)
export const withWeekOfYear = bindArgs(slotsWithTransform, slotsWithWeekOfYear)

// Non-standard: Move
// -----------------------------------------------------------------------------

export const addYears = bindArgs(moveByDateUnit, moveByYears)
export const addMonths = bindArgs(moveByDateUnit, moveByMonths)
export const addWeeks = bindArgs(moveByDateUnit, moveByIsoWeeks)
export const addDays = bindArgs(moveByDateUnit, moveByDays)
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

export const diffHours = bindArgs(diffZonedTimeUnits, Unit.Hour)
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
export const diffNanoseconds = bindArgs(diffZonedTimeUnits, 1, Unit.Nanosecond)

// Non-standard: Utils
// -----------------------------------------------------------------------------

function slotsWithTransform(
  transformIso: (
    isoSlots: DateTimeSlots<string>,
    units: number,
    options?: OverflowOptions,
  ) => IsoDateTimeFields,
  record: Record,
  units: number,
  options?: OverflowOptions,
): Record {
  const { timeZone, calendar } = record
  const timeZoneOps = queryNativeTimeZone(timeZone)
  const isoSlots = zonedEpochSlotsToIso(record, timeZoneOps)
  const transformedIsoSlots = transformIso(isoSlots, units, options)
  const epochNano1 = getSingleInstantFor(timeZoneOps, transformedIsoSlots)

  return createZonedDateTimeSlots(
    checkEpochNanoInBounds(epochNano1),
    timeZone,
    calendar,
  )
}

function moveByDateUnit(
  moveIso: (
    isoSlots: DateTimeSlots<string>,
    units: number,
  ) => IsoDateTimeFields,
  record: Record,
  units: number,
): Record {
  const timeZoneOps = queryNativeTimeZone(record.timeZone)
  const isoSlots0 = zonedEpochSlotsToIso(record, timeZoneOps)
  const isoSlots1 = moveIso(isoSlots0, units)
  const epochNano1 = getSingleInstantFor(timeZoneOps, isoSlots1)

  return {
    ...record,
    epochNanoseconds: checkEpochNanoInBounds(epochNano1),
  }
}

function moveByTimeUnit(
  nanoInUnit: number,
  record: Record,
  units: number,
): Record {
  const epochNano1 = addBigNanos(
    record.epochNanoseconds,
    numberToBigNano(units, nanoInUnit),
  )
  return {
    ...record,
    epochNanoseconds: checkEpochNanoInBounds(epochNano1),
  }
}

function rountToInterval(
  unit: Unit,
  computeInterval: (isoFields: DateSlots<string>) => IsoDateTimeInterval,
  record: Record,
  options?: RoundingModeName | RoundingMathOptions,
): Record {
  const { timeZone, calendar } = record
  const [, roundingMode] = refineRoundingMathOptions(unit, options)
  const timeZoneOps = queryNativeTimeZone(timeZone)
  const epochNano1 = roundZonedEpochToInterval(
    computeInterval,
    timeZoneOps,
    record,
    roundingMode,
  )
  return createZonedDateTimeSlots(
    checkEpochNanoInBounds(epochNano1),
    timeZone,
    calendar,
  )
}

function aligned(
  computeAlignment: (record: DateTimeSlots<string>) => IsoDateTimeFields,
  nanoDelta = 0,
): (record: Record) => Record {
  return (record) => {
    const { timeZone, calendar } = record
    const timeZoneOps = queryNativeTimeZone(timeZone)
    const epochNano1 = moveBigNano(
      alignZonedEpoch(computeAlignment, timeZoneOps, record),
      nanoDelta,
    )
    return createZonedDateTimeSlots(
      checkEpochNanoInBounds(epochNano1),
      timeZone,
      calendar,
    )
  }
}
