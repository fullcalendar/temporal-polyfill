import { DateTimeBag, DateTimeFields } from '../internal/fields'
import { bindArgs } from '../internal/utils'
import { formatOffsetNano, formatZonedDateTimeIso } from '../internal/isoFormat'
import { ZonedDateTimeFields, computeHoursInDay, computeStartOfDay, buildZonedIsoFields, zonedEpochSlotsToIso } from '../internal/timeZoneOps'
import { LocalesArg } from '../internal/intlFormat'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { ZonedFieldOptions } from '../internal/optionsRefine'
import { DateSlots, ZonedDateTimeSlots, getCalendarIdFromBag, refineCalendarSlotString, refineTimeZoneSlotString } from '../internal/slots'
import { computeIsoDayOfWeek, computeIsoDaysInWeek, computeIsoWeekOfYear, computeIsoYearOfWeek } from '../internal/isoMath'
import { createNativeDateModOps, createNativeDateRefineOps, createNativeDiffOps, createNativeMonthDayRefineOps, createNativeMoveOps, createNativeYearMonthRefineOps } from '../internal/calendarNativeQuery'
import { ZonedDateTimeBag, isoTimeFieldsToCal, refineZonedDateTimeBag, zonedDateTimeWithFields } from '../internal/bagRefine'
import { constructZonedDateTimeSlots } from '../internal/construct'
import { parseZonedDateTime } from '../internal/isoParse'
import { slotsWithCalendar, slotsWithTimeZone, zonedDateTimeWithPlainDate, zonedDateTimeWithPlainTime } from '../internal/modify'
import { moveZonedDateTime } from '../internal/move'
import { diffZonedDateTimes } from '../internal/diff'
import { roundZonedDateTime } from '../internal/round'
import { compareZonedDateTimes, zonedDateTimesEqual } from '../internal/compare'
import { zonedDateTimeToPlainDate, zonedDateTimeToPlainDateTime, zonedDateTimeToPlainMonthDay, zonedDateTimeToPlainTime, zonedDateTimeToPlainYearMonth } from '../internal/convert'
import { prepCachedZonedDateTimeFormat } from './intlFormatCached'
import { computeDateFields, computeDayOfYear, computeDaysInMonth, computeDaysInYear, computeInLeapYear, computeMonthsInYear } from './utils'

export const create = bindArgs(
  constructZonedDateTimeSlots<string, string, string, string>,
  refineCalendarSlotString,
  refineTimeZoneSlotString,
)

export const fromString = parseZonedDateTime

export function fromFields(
  fields: ZonedDateTimeBag<string, string>,
  options?: ZonedFieldOptions,
): ZonedDateTimeSlots<string, string> {
  const calendarId = getCalendarIdFromBag(fields)
  return refineZonedDateTimeBag(
    refineTimeZoneSlotString,
    queryNativeTimeZone,
    createNativeDateRefineOps(calendarId),
    calendarId,
    fields,
    options,
  )
}

export const getISOFields = bindArgs(
  buildZonedIsoFields<string, string>,
  queryNativeTimeZone,
)

export function getFields(
  zonedDateTimeSlots: ZonedDateTimeSlots<string, string>,
): ZonedDateTimeFields {
  const isoFields = zonedEpochSlotsToIso(zonedDateTimeSlots, queryNativeTimeZone)
  const offsetString = formatOffsetNano(isoFields.offsetNanoseconds)

  return {
    ...computeDateFields(isoFields),
    ...isoTimeFieldsToCal(isoFields),
    offset: offsetString,
  }
}

export const dayOfWeek = adaptDateFunc(computeIsoDayOfWeek)
export const daysInWeek = adaptDateFunc(computeIsoDaysInWeek)
export const weekOfYear = adaptDateFunc(computeIsoWeekOfYear)
export const yearOfWeek = adaptDateFunc(computeIsoYearOfWeek)
export const dayOfYear = adaptDateFunc(computeDayOfYear)
export const daysInMonth = adaptDateFunc(computeDaysInMonth)
export const daysInYear = adaptDateFunc(computeDaysInYear)
export const monthsInYear = adaptDateFunc(computeMonthsInYear)
export const inLeapYear = adaptDateFunc(computeInLeapYear)

export const startOfDay = bindArgs(computeStartOfDay<string, string>, queryNativeTimeZone)
export const hoursInDay = bindArgs(computeHoursInDay<string, string>, queryNativeTimeZone)

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

export const withPlainTime = bindArgs(
  zonedDateTimeWithPlainTime<string, string>,
  queryNativeTimeZone,
)

export const withPlainDate = bindArgs(
  zonedDateTimeWithPlainDate<string, string>,
  queryNativeTimeZone,
)

export function withTimeZone(
  slots: ZonedDateTimeSlots<string, string>,
  timeZoneId: string,
): ZonedDateTimeSlots<string, string> {
  return slotsWithTimeZone(slots, refineTimeZoneSlotString(timeZoneId))
}

export function withCalendar(
  slots: ZonedDateTimeSlots<string, string>,
  calendarId: string,
): ZonedDateTimeSlots<string, string> {
  return slotsWithCalendar(slots, refineCalendarSlotString(calendarId))
}

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

export const compare = compareZonedDateTimes<string, string>
export const equals = zonedDateTimesEqual<string, string>

export const toString = bindArgs(
  formatZonedDateTimeIso<string, string>,
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

export const toPlainDateTime = bindArgs(
  zonedDateTimeToPlainDateTime<string, string>,
  queryNativeTimeZone,
)

export const toPlainYearMonth = bindArgs(
  zonedDateTimeToPlainYearMonth<string>,
  createNativeYearMonthRefineOps,
)

export const toPlainMonthDay = bindArgs(
  zonedDateTimeToPlainMonthDay<string>,
  createNativeMonthDayRefineOps
)

export function toLocaleString(
  slots: ZonedDateTimeSlots<string, string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepCachedZonedDateTimeFormat(locales, options, slots)
  return format.format(epochMilli)
}

export function toLocaleStringParts(
  slots: ZonedDateTimeSlots<string, string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli] = prepCachedZonedDateTimeFormat(locales, options, slots)
  return format.formatToParts(epochMilli)
}

export function rangeToLocaleString(
  slots0: ZonedDateTimeSlots<string, string>,
  slots1: ZonedDateTimeSlots<string, string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli0, epochMilli1] = prepCachedZonedDateTimeFormat(locales, options, slots0, slots1)
  return (format as any).formatRange(epochMilli0, epochMilli1!)
}

export function rangeToLocaleStringParts(
  slots0: ZonedDateTimeSlots<string, string>,
  slots1: ZonedDateTimeSlots<string, string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
  ): Intl.DateTimeFormatPart[] {
  const [format, epochMilli0, epochMilli1] = prepCachedZonedDateTimeFormat(locales, options, slots0, slots1)
  return (format as any).formatRangeToParts(epochMilli0, epochMilli1!)
}

// Utils
// -------------------------------------------------------------------------------------------------

function adaptDateFunc<R>(
  dateFunc: (dateSlots: DateSlots<string>) => R,
): (slots: ZonedDateTimeSlots<string, string>) => R {
  return (slots: ZonedDateTimeSlots<string, string>) => {
    return dateFunc(zonedEpochSlotsToIso(slots, queryNativeTimeZone))
  }
}
