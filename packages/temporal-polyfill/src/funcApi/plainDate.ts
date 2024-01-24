import { DateBag, DateFields, EraYearFields } from '../internal/calendarFields'
import { NumSign, bindArgs, identityFunc } from '../internal/utils'
import { LocalesArg } from '../internal/formatIntl'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { OverflowOptions } from '../internal/optionsRefine'
import { PlainDateSlots, PlainDateTimeSlots, PlainMonthDaySlots, PlainTimeSlots, PlainYearMonthSlots, ZonedDateTimeSlots, getCalendarIdFromBag, refineCalendarSlotString, refineTimeZoneSlotString } from '../internal/slots'
import { createNativeDateModOps, createNativeDateRefineOps, createNativeDiffOps, createNativeMonthDayRefineOps, createNativeMoveOps, createNativePartOps, createNativeYearMonthRefineOps } from '../internal/calendarNativeQuery'
import { constructPlainDateSlots } from '../internal/construct'
import { parsePlainDate } from '../internal/parseIso'
import { plainDateWithFields, refinePlainDateBag } from '../internal/bag'
import { slotsWithCalendar } from '../internal/mod'
import { movePlainDate } from '../internal/move'
import { diffPlainDates } from '../internal/diff'
import { plainDatesEqual, compareIsoDateFields } from '../internal/compare'
import { formatPlainDateIso } from '../internal/formatIso'
import { plainDateToPlainDateTime, plainDateToPlainMonthDay, plainDateToPlainYearMonth, plainDateToZonedDateTime } from '../internal/convert'
import { prepCachedPlainDateFormat } from './formatIntlCached'
import { computeDateBasics, computeDateFields, computeDayOfYear, computeDaysInMonth, computeDaysInYear, computeInLeapYear, computeMonthsInYear } from './utils'
import { computeIsoDayOfWeek, computeIsoDaysInWeek, computeIsoWeekOfYear, computeIsoYearOfWeek } from '../internal/calendarIso'

// TODO: do Readonly<> everywhere?
// OR do it on the PlainDateSlots?
// TODO: name all args properly like 'plainDateSlots'???

export const create = bindArgs(
  constructPlainDateSlots<string, string>,
  refineCalendarSlotString,
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

export const getFields = computeDateFields as (
  slots: PlainDateSlots<string>
) => DateFields & Partial<EraYearFields>

export const dayOfWeek = computeIsoDayOfWeek as (slots: PlainDateSlots<string>) => number
export const daysInWeek = computeIsoDaysInWeek as (slots: PlainDateSlots<string>) => number
export const weekOfYear = computeIsoWeekOfYear as (slots: PlainDateSlots<string>) => number
export const yearOfWeek = computeIsoYearOfWeek as (slots: PlainDateSlots<string>) => number
export const dayOfYear = computeDayOfYear as (slots: PlainDateSlots<string>) => number
export const daysInMonth = computeDaysInMonth as (slots: PlainDateSlots<string>) => number
export const daysInYear = computeDaysInYear as (slots: PlainDateSlots<string>) => number
export const monthsInYear = computeMonthsInYear as (slots: PlainDateSlots<string>) => number
export const inLeapYear = computeInLeapYear as (slots: PlainDateSlots<string>) => boolean

export function withFields(
  slots: PlainDateSlots<string>,
  fields: DateBag,
  options?: OverflowOptions,
): PlainDateSlots<string> {
  return plainDateWithFields(
    createNativeDateModOps,
    slots,
    computeDateBasics(slots),
    fields,
    options,
  )
}

export function withCalendar(
  slots: PlainDateSlots<string>,
  calendarId: string,
): PlainDateSlots<string> {
  return slotsWithCalendar(slots, refineCalendarSlotString(calendarId))
}

export const add = bindArgs(movePlainDate<string>, createNativeMoveOps, false)
export const subtract = bindArgs(movePlainDate<string>, createNativeMoveOps, true)

export const until = bindArgs(diffPlainDates<string>, createNativeDiffOps, false)
export const since = bindArgs(diffPlainDates<string>, createNativeDiffOps, true)

export const equals = plainDatesEqual<string>
export const compare = compareIsoDateFields as (
  slots0: PlainDateSlots<string>,
  slots1: PlainDateSlots<string>,
) => NumSign

export const toString = formatPlainDateIso<string>

export function toZonedDateTime(
  slots: PlainDateSlots<string>,
  options: string | { timeZone: string, plainTime?: PlainTimeSlots },
): ZonedDateTimeSlots<string, string> {
  const optionsObj = typeof options === 'string'
    ? { timeZone: options }
    : options

  return plainDateToZonedDateTime(
    refineTimeZoneSlotString,
    identityFunc,
    queryNativeTimeZone,
    slots,
    optionsObj,
  )
}

export const toPlainDateTime = plainDateToPlainDateTime as (
  plainDateSlots: PlainDateSlots<string>,
  plainTimeSlots: PlainTimeSlots,
) => PlainDateTimeSlots<string>

export function toPlainYearMonth(slots: PlainDateSlots<string>): PlainYearMonthSlots<string> {
  return plainDateToPlainYearMonth(
    createNativeYearMonthRefineOps,
    slots,
    computeDateBasics(slots),
  )
}

export function toPlainMonthDay(slots: PlainDateSlots<string>): PlainMonthDaySlots<string> {
  return plainDateToPlainMonthDay(
    createNativeMonthDayRefineOps,
    slots,
    computeDateBasics(slots),
  )
}

export function toLocaleString(
  slots: PlainDateSlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepCachedPlainDateFormat(locales, options, slots)
  return format.format(epochMilli)
}

export function toLocaleStringParts(
  slots: PlainDateSlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli] = prepCachedPlainDateFormat(locales, options, slots)
  return format.formatToParts(epochMilli)
}

export function rangeToLocaleString(
  slots0: PlainDateSlots<string>,
  slots1: PlainDateSlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli0, epochMilli1] = prepCachedPlainDateFormat(locales, options, slots0, slots1)
  return (format as any).formatRange(epochMilli0, epochMilli1!)
}

export function rangeToLocaleStringParts(
  slots0: PlainDateSlots<string>,
  slots1: PlainDateSlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
  ): Intl.DateTimeFormatPart[] {
  const [format, epochMilli0, epochMilli1] = prepCachedPlainDateFormat(locales, options, slots0, slots1)
  return (format as any).formatRangeToParts(epochMilli0, epochMilli1!)
}