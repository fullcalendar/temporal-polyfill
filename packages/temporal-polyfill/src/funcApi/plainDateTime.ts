import {
  PlainDateTimeBag,
  isoTimeFieldsToCal,
  plainDateTimeWithFields,
  refinePlainDateTimeBag,
} from '../internal/bagRefine'
import { addBigNanos, numberToBigNano } from '../internal/bigNano'
import { refineCalendarId } from '../internal/calendarId'
import {
  createNativeDateModOps,
  createNativeDateRefineOps,
  createNativeDiffOps,
  createNativeMonthDayRefineOps,
  createNativeMoveOps,
  createNativeYearMonthRefineOps,
} from '../internal/calendarNativeQuery'
import {
  compareIsoDateTimeFields,
  plainDateTimesEqual,
} from '../internal/compare'
import { constructPlainDateTimeSlots } from '../internal/construct'
import {
  plainDateTimeToPlainMonthDay,
  plainDateTimeToPlainYearMonth,
  plainDateTimeToZonedDateTime,
} from '../internal/convert'
import { diffPlainDateTimes } from '../internal/diff'
import { DateTimeBag, DateTimeFields } from '../internal/fields'
import { createFormatPrepper, dateTimeConfig } from '../internal/intlFormatPrep'
import { LocalesArg } from '../internal/intlFormatUtils'
import { IsoDateTimeFields } from '../internal/isoFields'
import { formatPlainDateTimeIso } from '../internal/isoFormat'
import { computeIsoDayOfWeek, computeIsoDaysInWeek } from '../internal/isoMath'
import { parsePlainDateTime } from '../internal/isoParse'
import {
  plainDateTimeWithPlainDate,
  plainDateTimeWithPlainTime,
  slotsWithCalendar,
} from '../internal/modify'
import { moveByDays, movePlainDateTime } from '../internal/move'
import {
  DateTimeDisplayOptions,
  DiffOptions,
  EpochDisambigOptions,
  OverflowOptions,
  RoundingMathOptions,
  RoundingModeName,
  RoundingOptions,
  refineRoundingMathOptions,
} from '../internal/optionsRefine'
import {
  IsoDateTimeInterval,
  computeDayFloor,
  roundPlainDateTime,
} from '../internal/round'
import {
  DateSlots,
  DateTimeSlots,
  PlainDateTimeBranding,
  createPlainDateSlots,
  createPlainTimeSlots,
} from '../internal/slots'
import {
  checkIsoDateTimeInBounds,
  epochNanoToIso,
  isoToEpochNano,
} from '../internal/timeMath'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
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
  diffPlainTimeUnits,
  diffPlainWeeks,
  diffPlainYears,
} from './diffUtils'
import * as DurationFns from './duration'
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
  roundDateTimeToInterval,
} from './roundUtils'
import * as ZonedDateTimeFns from './zonedDateTime'

export type Record = {
  /**
   * @deprecated Use the isInstance() function instead.
   */
  branding: typeof PlainDateTimeBranding

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

  /**
   * @deprecated Use the getISOFields() function instead.
   */
  readonly isoHour: number

  /**
   * @deprecated Use the getISOFields() function instead.
   */
  readonly isoMinute: number

  /**
   * @deprecated Use the getISOFields() function instead.
   */
  readonly isoSecond: number

  /**
   * @deprecated Use the getISOFields() function instead.
   */
  readonly isoMillisecond: number

  /**
   * @deprecated Use the getISOFields() function instead.
   */
  readonly isoMicrosecond: number

  /**
   * @deprecated Use the getISOFields() function instead.
   */
  readonly isoNanosecond: number
}

export type Fields = DateTimeFields
export type FromFields = PlainDateTimeBag<string>
export type WithFields = DateTimeBag
export type ISOFields = IsoDateTimeFields

export type AssignmentOptions = OverflowOptions
export type ArithmeticOptions = OverflowOptions
export type DifferenceOptions = DiffOptions<UnitName>
export type RoundOptions = RoundingOptions<DayTimeUnitName>
export type ToZonedDateTimeOptions = EpochDisambigOptions
export type ToStringOptions = DateTimeDisplayOptions

// Creation / Parsing
// -----------------------------------------------------------------------------

export const create = bindArgs(
  constructPlainDateTimeSlots<string, string>,
  refineCalendarId,
) as (
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  isoHour?: number,
  isoMinute?: number,
  isoSecond?: number,
  isoMillisecond?: number,
  isoMicrosecond?: number,
  isoNanosecond?: number,
  calendar?: string,
) => Record

export function fromFields(
  fields: FromFields,
  options?: AssignmentOptions,
): Record {
  return refinePlainDateTimeBag(
    createNativeDateRefineOps(getCalendarIdFromBag(fields)),
    fields,
    options,
  )
}

export const fromString = parsePlainDateTime as (s: string) => Record

export function isInstance(record: any): record is Record {
  return Boolean(record) && record.branding === PlainDateTimeBranding
}

// Getters
// -----------------------------------------------------------------------------

export const getFields = memoize((record: Record): Fields => {
  return {
    ...computeDateFields(record),
    ...isoTimeFieldsToCal(record),
  }
}, WeakMap)

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
  return plainDateTimeWithFields(
    createNativeDateModOps,
    record,
    getFields(record),
    fields,
    options,
  )
}

export function withCalendar(record: Record, calendar: string): Record {
  return slotsWithCalendar(record, refineCalendarId(calendar))
}

export const withPlainDate = plainDateTimeWithPlainDate as (
  plainDateTimeRecord: Record,
  plainDateRecord: PlainDateFns.Record,
) => Record

export const withPlainTime = plainDateTimeWithPlainTime as (
  plainDateTimeRecord: Record,
  plainTimeRecord?: PlainTimeFns.Record,
) => Record

// Math
// -----------------------------------------------------------------------------

export const add = bindArgs(
  movePlainDateTime<string>,
  createNativeMoveOps,
  false,
) as (
  plainDateTimeRecord: Record,
  durationRecord: DurationFns.Record,
  options?: ArithmeticOptions,
) => Record

export const subtract = bindArgs(
  movePlainDateTime<string>,
  createNativeMoveOps,
  true,
) as (
  plainDateTimeRecord: Record,
  durationRecord: DurationFns.Record,
  options?: ArithmeticOptions,
) => Record

export const until = bindArgs(
  diffPlainDateTimes<string>,
  createNativeDiffOps,
  false,
) as (
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
) => DurationFns.Record

export const since = bindArgs(
  diffPlainDateTimes<string>,
  createNativeDiffOps,
  true,
) as (
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
) => DurationFns.Record

export const round = roundPlainDateTime<string> as (
  record: Record,
  options: DayTimeUnitName | RoundOptions,
) => Record

export const equals = plainDateTimesEqual<string> as (
  record0: Record,
  record1: Record,
) => boolean

export const compare = compareIsoDateTimeFields as (
  record0: Record,
  record1: Record,
) => NumberSign

// Conversion
// -----------------------------------------------------------------------------

export const toZonedDateTime = bindArgs(
  plainDateTimeToZonedDateTime<string, string>,
  queryNativeTimeZone,
) as (
  record: Record,
  timeZone: string,
  options?: ToZonedDateTimeOptions,
) => ZonedDateTimeFns.Record

export const toPlainDate = createPlainDateSlots as (
  record: Record,
) => PlainDateFns.Record

export const toPlainTime = createPlainTimeSlots as (
  record: Record,
) => PlainTimeFns.Record

export function toPlainYearMonth(record: Record): PlainYearMonthFns.Record {
  return plainDateTimeToPlainYearMonth(
    createNativeYearMonthRefineOps,
    record,
    getFields(record),
  )
}

export function toPlainMonthDay(record: Record): PlainMonthDayFns.Record {
  return plainDateTimeToPlainMonthDay(
    createNativeMonthDayRefineOps,
    record,
    getFields(record),
  )
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

export const toString = formatPlainDateTimeIso<string> as (
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
  return checkIsoDateTimeInBounds(moveToDayOfYear(record, dayOfYear, options))
}

export function withDayOfMonth(
  record: Record,
  dayOfMonth: number,
  options?: OverflowOptions,
): Record {
  return checkIsoDateTimeInBounds(moveToDayOfMonth(record, dayOfMonth, options))
}

export function withDayOfWeek(
  record: Record,
  dayOfWeek: number,
  options?: OverflowOptions,
): Record {
  return checkIsoDateTimeInBounds(moveToDayOfWeek(record, dayOfWeek, options))
}

export function withWeekOfYear(
  record: Record,
  weekOfYear: number,
  options?: OverflowOptions,
): Record {
  return checkIsoDateTimeInBounds(
    slotsWithWeekOfYear(record, weekOfYear, options),
  )
}

// Non-standard: Add
// -----------------------------------------------------------------------------

export function addYears(record: Record, years: number): Record {
  return checkIsoDateTimeInBounds(moveByYears(record, years))
}

export function addMonths(record: Record, months: number): Record {
  return checkIsoDateTimeInBounds(moveByMonths(record, months))
}

export function addWeeks(record: Record, weeks: number): Record {
  return checkIsoDateTimeInBounds(moveByIsoWeeks(record, weeks))
}

export function addDays(record: Record, days: number): Record {
  return checkIsoDateTimeInBounds(moveByDays(record, days))
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
export const startOfHour = aligned(computeHourFloor)
export const startOfMinute = aligned(computeMinuteFloor)
export const startOfSecond = aligned(computeSecFloor)
export const startOfMillisecond = aligned(computeMilliFloor)
export const startOfMicrosecond = aligned(computeMicroFloor)

// Non-standard: End-of-Unit (EXCL)
// -----------------------------------------------------------------------------

export const endOfYearExcl = aligned(computeYearCeil)
export const endOfMonthExcl = aligned(computeMonthCeil)
export const endOfWeekExcl = aligned(computeIsoWeekCeil)
export const endOfDayExcl = aligned(computeDayFloor, nanoInUtcDay)
export const endOfHourExcl = aligned(computeHourFloor, nanoInHour)
export const endOfMinuteExcl = aligned(computeMinuteFloor, nanoInMinute)
export const endOfSecondExcl = aligned(computeSecFloor, nanoInSec)
export const endOfMillisecondExcl = aligned(computeMilliFloor, nanoInMilli)
export const endOfMicrosecondExcl = aligned(computeMicroFloor, nanoInMicro)

// Non-standard: End-of-Unit (INCL)
// -----------------------------------------------------------------------------

export const endOfYearIncl = aligned(computeYearCeil, -1)
export const endOfMonthIncl = aligned(computeMonthCeil, -1)
export const endOfWeekIncl = aligned(computeIsoWeekCeil, -1)
export const endOfDayIncl = aligned(computeDayFloor, nanoInUtcDay - 1)
export const endOfHourIncl = aligned(computeHourFloor, nanoInHour - 1)
export const endOfMinuteIncl = aligned(computeMinuteFloor, nanoInMinute - 1)
export const endOfSecondIncl = aligned(computeSecFloor, nanoInSec - 1)
export const endOfMillisecondIncl = aligned(computeMilliFloor, nanoInMilli - 1)
export const endOfMicrosecondIncl = aligned(computeMicroFloor, nanoInMicro - 1)

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

export const diffNanoseconds = bindArgs(diffPlainTimeUnits, 1, Unit.Nanosecond)

// Non-standard: Utils
// -----------------------------------------------------------------------------

function moveByTimeUnit(
  nanoInUnit: number,
  record: Record,
  units: number,
): Record {
  const epochNano0 = isoToEpochNano(record)!
  const epochNano1 = addBigNanos(epochNano0, numberToBigNano(units, nanoInUnit))
  return checkIsoDateTimeInBounds({
    ...record,
    ...epochNanoToIso(epochNano1, 0),
  })
}

function roundToInterval(
  unit: Unit,
  computeInterval: (isoFields: DateSlots<string>) => IsoDateTimeInterval,
  record: Record,
  options?: RoundingModeName | RoundingMathOptions,
): Record {
  const [, roundingMode] = refineRoundingMathOptions(unit, options)
  return checkIsoDateTimeInBounds(
    roundDateTimeToInterval(computeInterval, record, roundingMode),
  )
}

function aligned(
  computeAlignment: (slots: DateTimeSlots<string>) => IsoDateTimeFields,
  nanoDelta = 0,
): (slots: Record) => Record {
  return (slots) => {
    let isoFields = computeAlignment(slots)
    if (nanoDelta) {
      isoFields = epochNanoToIso(isoToEpochNano(isoFields)!, nanoDelta)
    }
    return checkIsoDateTimeInBounds({
      ...slots,
      ...isoFields,
    })
  }
}
