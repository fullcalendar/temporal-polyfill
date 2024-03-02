import {
  ZonedDateTimeBag,
  isoTimeFieldsToCal,
  refineZonedDateTimeBag,
  zonedDateTimeWithFields,
} from '../internal/bagRefine'
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
import { formatOffsetNano, formatZonedDateTimeIso } from '../internal/isoFormat'
import { computeIsoDayOfWeek, computeIsoDaysInWeek } from '../internal/isoMath'
import { parseZonedDateTime } from '../internal/isoParse'
import {
  slotsWithCalendar,
  slotsWithTimeZone,
  zonedDateTimeWithPlainDate,
  zonedDateTimeWithPlainTime,
} from '../internal/modify'
import { moveZonedDateTime } from '../internal/move'
import { ZonedFieldOptions } from '../internal/optionsRefine'
import { roundZonedDateTime } from '../internal/round'
import {
  DateSlots,
  PlainMonthDaySlots,
  PlainYearMonthSlots,
  ZonedDateTimeSlots,
  getEpochMicro,
  getEpochMilli,
  getEpochNano,
  getEpochSec,
} from '../internal/slots'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import {
  ZonedDateTimeFields,
  buildZonedIsoFields,
  computeHoursInDay,
  computeStartOfDay,
  zonedEpochSlotsToIso,
} from '../internal/timeZoneOps'
import { bindArgs, memoize } from '../internal/utils'
import { createFormatCache } from './intlFormatCache'
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
  refineCalendarIdString,
  refineTimeZoneIdString,
} from './utils'

// TODO: rename to keep scope? Slots/Fields/Bag?
export type { ZonedDateTimeSlots, ZonedDateTimeBag, DateTimeBag }

export const create = bindArgs(
  constructZonedDateTimeSlots<string, string, string, string>,
  refineCalendarIdString,
  refineTimeZoneIdString,
)

export const fromString = parseZonedDateTime

export function fromFields(
  fields: ZonedDateTimeBag<string, string>,
  options?: ZonedFieldOptions,
): ZonedDateTimeSlots<string, string> {
  const calendarId = getCalendarIdFromBag(fields)
  return refineZonedDateTimeBag(
    refineTimeZoneIdString,
    queryNativeTimeZone,
    createNativeDateRefineOps(calendarId),
    calendarId,
    fields,
    options,
  )
}

export const epochSeconds = getEpochSec as (
  slots: ZonedDateTimeSlots<string, string>,
) => number
export const epochMilliseconds = getEpochMilli as (
  slots: ZonedDateTimeSlots<string, string>,
) => number
export const epochMicroseconds = getEpochMicro as (
  slots: ZonedDateTimeSlots<string, string>,
) => bigint
export const epochNanoseconds = getEpochNano as (
  slots: ZonedDateTimeSlots<string, string>,
) => bigint

export function offsetNanoseconds(
  slots: ZonedDateTimeSlots<string, string>,
): number {
  return zonedEpochSlotsToIso(slots, queryNativeTimeZone).offsetNanoseconds
}

// not memoized
export const getISOFields = bindArgs(
  buildZonedIsoFields<string, string>,
  queryNativeTimeZone,
)

export const getFields = memoize(
  (
    zonedDateTimeSlots: ZonedDateTimeSlots<string, string>,
  ): ZonedDateTimeFields => {
    const isoFields = zonedEpochSlotsToIso(
      zonedDateTimeSlots,
      queryNativeTimeZone,
    )
    const offsetString = formatOffsetNano(isoFields.offsetNanoseconds)

    return {
      ...computeDateFields(isoFields),
      ...isoTimeFieldsToCal(isoFields),
      offset: offsetString,
    }
  },
  WeakMap,
)

export function withFields(
  slots: ZonedDateTimeSlots<string, string>,
  fields: DateTimeBag,
  options?: ZonedFieldOptions,
): ZonedDateTimeSlots<string, string> {
  return zonedDateTimeWithFields(
    createNativeDateModOps,
    queryNativeTimeZone,
    slots,
    getFields(slots),
    fields,
    options,
  )
}

export function withTimeZone(
  slots: ZonedDateTimeSlots<string, string>,
  timeZoneId: string,
): ZonedDateTimeSlots<string, string> {
  return slotsWithTimeZone(slots, refineTimeZoneIdString(timeZoneId))
}

export function withCalendar(
  slots: ZonedDateTimeSlots<string, string>,
  calendarId: string,
): ZonedDateTimeSlots<string, string> {
  return slotsWithCalendar(slots, refineCalendarIdString(calendarId))
}

export const withPlainDate = bindArgs(
  zonedDateTimeWithPlainDate<string, string>,
  queryNativeTimeZone,
)

export const withPlainTime = bindArgs(
  zonedDateTimeWithPlainTime<string, string>,
  queryNativeTimeZone,
)

export const dayOfWeek = adaptDateFunc(computeIsoDayOfWeek)
export const daysInWeek = adaptDateFunc(computeIsoDaysInWeek)
export const weekOfYear = adaptDateFunc(computeWeekOfYear)
export const yearOfWeek = adaptDateFunc(computeYearOfWeek)
export const dayOfYear = adaptDateFunc(computeDayOfYear)
export const daysInMonth = adaptDateFunc(computeDaysInMonth)
export const daysInYear = adaptDateFunc(computeDaysInYear)
export const monthsInYear = adaptDateFunc(computeMonthsInYear)
export const inLeapYear = adaptDateFunc(computeInLeapYear)

export const startOfDay = bindArgs(
  computeStartOfDay<string, string>,
  queryNativeTimeZone,
)

export const hoursInDay = bindArgs(
  computeHoursInDay<string, string>,
  queryNativeTimeZone,
)

export const add = bindArgs(
  moveZonedDateTime<string, string>,
  createNativeMoveOps,
  queryNativeTimeZone,
  false,
)

export const subtract = bindArgs(
  moveZonedDateTime<string, string>,
  createNativeMoveOps,
  queryNativeTimeZone,
  true,
)

export const until = bindArgs(
  diffZonedDateTimes<string, string>,
  createNativeDiffOps,
  queryNativeTimeZone,
  false,
)

export const since = bindArgs(
  diffZonedDateTimes<string, string>,
  createNativeDiffOps,
  queryNativeTimeZone,
  true,
)

export const round = bindArgs(
  roundZonedDateTime<string, string>,
  queryNativeTimeZone,
)

export const equals = zonedDateTimesEqual<string, string>
export const compare = compareZonedDateTimes<string, string>

export const toPlainDateTime = bindArgs(
  zonedDateTimeToPlainDateTime<string, string>,
  queryNativeTimeZone,
)

export const toPlainDate = bindArgs(
  zonedDateTimeToPlainDate<string, string>,
  queryNativeTimeZone,
)

export const toPlainTime = bindArgs(
  zonedDateTimeToPlainTime<string, string>,
  queryNativeTimeZone,
)

export function toPlainYearMonth(
  slots: ZonedDateTimeSlots<string, string>,
): PlainYearMonthSlots<string> {
  return zonedDateTimeToPlainYearMonth(
    createNativeYearMonthRefineOps,
    slots,
    getFields(slots),
  )
}

export function toPlainMonthDay(
  slots: ZonedDateTimeSlots<string, string>,
): PlainMonthDaySlots<string> {
  return zonedDateTimeToPlainMonthDay(
    createNativeMonthDayRefineOps,
    slots,
    getFields(slots),
  )
}

export const toString = bindArgs(
  formatZonedDateTimeIso<string, string>,
  queryNativeTimeZone,
)

// Intl Formatting
// -----------------------------------------------------------------------------

const prepFormat = createFormatPrepper(
  zonedConfig,
  /*@__PURE__*/ createFormatCache(),
)

export function toLocaleString(
  slots: ZonedDateTimeSlots<string, string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepFormat(locales, options, slots)
  return format.format(epochMilli)
}

export function toLocaleStringParts(
  slots: ZonedDateTimeSlots<string, string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli] = prepFormat(locales, options, slots)
  return format.formatToParts(epochMilli)
}

export function rangeToLocaleString(
  slots0: ZonedDateTimeSlots<string, string>,
  slots1: ZonedDateTimeSlots<string, string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli0, epochMilli1] = prepFormat(
    locales,
    options,
    slots0,
    slots1,
  )
  return (format as any).formatRange(epochMilli0, epochMilli1!)
}

export function rangeToLocaleStringParts(
  slots0: ZonedDateTimeSlots<string, string>,
  slots1: ZonedDateTimeSlots<string, string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli0, epochMilli1] = prepFormat(
    locales,
    options,
    slots0,
    slots1,
  )
  return (format as any).formatRangeToParts(epochMilli0, epochMilli1!)
}

// Utils
// -----------------------------------------------------------------------------

function adaptDateFunc<R>(
  dateFunc: (dateSlots: DateSlots<string>) => R,
): (slots: ZonedDateTimeSlots<string, string>) => R {
  return (slots: ZonedDateTimeSlots<string, string>) => {
    return dateFunc(zonedEpochSlotsToIso(slots, queryNativeTimeZone))
  }
}
