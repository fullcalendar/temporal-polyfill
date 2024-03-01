import { plainDateWithFields, refinePlainDateBag } from '../internal/bagRefine'
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
import {
  createFormatPrepper,
  plainDateConfig,
} from '../internal/intlFormatPrep'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatPlainDateIso } from '../internal/isoFormat'
import { computeIsoDayOfWeek, computeIsoDaysInWeek } from '../internal/isoMath'
import { parsePlainDate } from '../internal/isoParse'
import { slotsWithCalendar } from '../internal/modify'
import { movePlainDate } from '../internal/move'
import { OverflowOptions } from '../internal/optionsRefine'
import {
  PlainDateSlots,
  PlainDateTimeSlots,
  PlainMonthDaySlots,
  PlainTimeSlots,
  PlainYearMonthSlots,
  ZonedDateTimeSlots,
} from '../internal/slots'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { NumberSign, bindArgs, identity, memoize } from '../internal/utils'
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

// TODO: do Readonly<> everywhere?
// OR do it on the PlainDateSlots?
// TODO: name all args properly like 'plainDateSlots'???

// TODO: rename to keep scope? Slots/Fields/Bag?
export type { PlainDateSlots, DateBag }

export const create = bindArgs(
  constructPlainDateSlots<string, string>,
  refineCalendarIdString,
)

export const fromString = parsePlainDate

export function fromFields(
  fields: DateBag & { calendar?: string },
  options?: OverflowOptions,
): PlainDateSlots<string> {
  return refinePlainDateBag(
    createNativeDateRefineOps(getCalendarIdFromBag(fields)),
    fields,
    options,
  )
}

export const getFields = memoize(computeDateFields, WeakMap) as (
  slots: PlainDateSlots<string>,
) => DateFields

export function withFields(
  slots: PlainDateSlots<string>,
  fields: DateBag,
  options?: OverflowOptions,
): PlainDateSlots<string> {
  return plainDateWithFields(
    createNativeDateModOps,
    slots,
    getFields(slots),
    fields,
    options,
  )
}

export function withCalendar(
  slots: PlainDateSlots<string>,
  calendarId: string,
): PlainDateSlots<string> {
  return slotsWithCalendar(slots, refineCalendarIdString(calendarId))
}

export const dayOfWeek = computeIsoDayOfWeek as (
  slots: PlainDateSlots<string>,
) => number
export const daysInWeek = computeIsoDaysInWeek as (
  slots: PlainDateSlots<string>,
) => number
export const weekOfYear = computeWeekOfYear as (
  slots: PlainDateSlots<string>,
) => number | undefined
export const yearOfWeek = computeYearOfWeek as (
  slots: PlainDateSlots<string>,
) => number | undefined
export const dayOfYear = computeDayOfYear as (
  slots: PlainDateSlots<string>,
) => number
export const daysInMonth = computeDaysInMonth as (
  slots: PlainDateSlots<string>,
) => number
export const daysInYear = computeDaysInYear as (
  slots: PlainDateSlots<string>,
) => number
export const monthsInYear = computeMonthsInYear as (
  slots: PlainDateSlots<string>,
) => number
export const inLeapYear = computeInLeapYear as (
  slots: PlainDateSlots<string>,
) => boolean

export const add = bindArgs(movePlainDate<string>, createNativeMoveOps, false)
export const subtract = bindArgs(
  movePlainDate<string>,
  createNativeMoveOps,
  true,
)

export const until = bindArgs(
  diffPlainDates<string>,
  createNativeDiffOps,
  false,
)
export const since = bindArgs(diffPlainDates<string>, createNativeDiffOps, true)

export const equals = plainDatesEqual<string>
export const compare = compareIsoDateFields as (
  slots0: PlainDateSlots<string>,
  slots1: PlainDateSlots<string>,
) => NumberSign

export function toZonedDateTime(
  slots: PlainDateSlots<string>,
  options: string | { timeZone: string; plainTime?: PlainTimeSlots },
): ZonedDateTimeSlots<string, string> {
  const optionsObj =
    typeof options === 'string' ? { timeZone: options } : options

  return plainDateToZonedDateTime(
    refineTimeZoneIdString,
    identity,
    queryNativeTimeZone,
    slots,
    optionsObj,
  )
}

export const toPlainDateTime = plainDateToPlainDateTime as (
  plainDateSlots: PlainDateSlots<string>,
  plainTimeSlots?: PlainTimeSlots,
) => PlainDateTimeSlots<string>

export function toPlainYearMonth(
  slots: PlainDateSlots<string>,
): PlainYearMonthSlots<string> {
  return plainDateToPlainYearMonth(
    createNativeYearMonthRefineOps,
    slots,
    getFields(slots),
  )
}

export function toPlainMonthDay(
  slots: PlainDateSlots<string>,
): PlainMonthDaySlots<string> {
  return plainDateToPlainMonthDay(
    createNativeMonthDayRefineOps,
    slots,
    getFields(slots),
  )
}

export const toString = formatPlainDateIso<string>

// Intl Formatting
// -----------------------------------------------------------------------------

const prepFormat = createFormatPrepper(
  plainDateConfig,
  /*@__PURE__*/ createFormatCache(),
)

export function toLocaleString(
  slots: PlainDateSlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepFormat(locales, options, slots)
  return format.format(epochMilli)
}

export function toLocaleStringParts(
  slots: PlainDateSlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli] = prepFormat(locales, options, slots)
  return format.formatToParts(epochMilli)
}

export function rangeToLocaleString(
  slots0: PlainDateSlots<string>,
  slots1: PlainDateSlots<string>,
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
  slots0: PlainDateSlots<string>,
  slots1: PlainDateSlots<string>,
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
