import { DateBag } from '../internal/calendarFields'
import { identityFunc } from '../internal/utils'
import { LocalesArg } from '../internal/formatIntl'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { DiffOptions, OverflowOptions } from '../internal/optionsRefine'
import { DurationSlots, PlainDateSlots, PlainMonthDaySlots, PlainTimeSlots, PlainYearMonthSlots, ZonedDateTimeSlots, getCalendarIdFromBag, refineCalendarSlotString, refineTimeZoneSlotString } from '../internal/slots'
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
import { getDayOfYear, getDaysInMonth, getDaysInYear, getInLeapYear, getMonthsInYear, getDateFields } from './utils'
import { computeIsoDayOfWeek, computeIsoDaysInWeek, computeIsoWeekOfYear, computeIsoYearOfWeek } from '../internal/calendarIso'

// TODO: do Readonly<> everywhere?

export function create(
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendar?: string,
): PlainDateSlots<string> {
  return constructPlainDateSlots(refineCalendarSlotString, isoYear, isoMonth, isoDay, calendar)
}

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

// TODO: add specific types
export const getFields = getDateFields
export const dayOfWeek = computeIsoDayOfWeek
export const daysInWeek = computeIsoDaysInWeek
export const weekOfYear = computeIsoWeekOfYear
export const yearOfWeek = computeIsoYearOfWeek
export const dayOfYear = getDayOfYear
export const daysInMonth = getDaysInMonth
export const daysInYear = getDaysInYear
export const monthsInYear = getMonthsInYear
export const inLeapYear = getInLeapYear

export function withFields(
  slots: PlainDateSlots<string>,
  newFields: DateBag,
  options?: OverflowOptions,
): PlainDateSlots<string> {
  return plainDateWithFields(
    createNativeDateModOps,
    slots,
    getFields(slots), // TODO: just use y/m/d?
    newFields,
    options,
  )
}

export function withCalendar(
  slots: PlainDateSlots<string>,
  calendarId: string,
): PlainDateSlots<string> {
  return slotsWithCalendar(slots, refineCalendarSlotString(calendarId))
}

export function add(
  slots: PlainDateSlots<string>,
  durationSlots: DurationSlots,
  options?: OverflowOptions,
): PlainDateSlots<string> {
  return movePlainDate(
    createNativeMoveOps,
    slots,
    durationSlots,
    options,
  )
}

export function subtract(
  slots: PlainDateSlots<string>,
  durationSlots: DurationSlots,
  options?: OverflowOptions,
): PlainDateSlots<string> {
  return movePlainDate(
    createNativeMoveOps,
    slots,
    durationSlots,
    options,
    true,
  )
}

export function until(
  slots0: PlainDateSlots<string>,
  slots1: PlainDateSlots<string>,
  options?: DiffOptions,
): DurationSlots {
  return diffPlainDates(
    createNativeDiffOps,
    slots0,
    slots1,
    options,
  )
}

export function since(
  slots0: PlainDateSlots<string>,
  slots1: PlainDateSlots<string>,
  options?: DiffOptions,
): DurationSlots {
  return diffPlainDates(
    createNativeDiffOps,
    slots0,
    slots1,
    options,
    true,
  )
}

// TODO: specific args
export const equals = plainDatesEqual
export const compare = compareIsoDateFields
export const toString = formatPlainDateIso

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

export const toPlainDateTime = plainDateToPlainDateTime

export function toPlainYearMonth(slots: PlainDateSlots<string>): PlainYearMonthSlots<string> {
  const calenadarOps = createNativePartOps(slots.calendar)
  const [year, month, day] = calenadarOps.dateParts(slots) // TODO: DRY

  return plainDateToPlainYearMonth(
    createNativeYearMonthRefineOps,
    slots,
    { year, month, day },
  )
}

export function toPlainMonthDay(slots: PlainDateSlots<string>): PlainMonthDaySlots<string> {
  const calenadarOps = createNativePartOps(slots.calendar)
  const [year, month, day] = calenadarOps.dateParts(slots) // TODO: DRY

  return plainDateToPlainMonthDay(
    createNativeMonthDayRefineOps,
    slots,
    { year, month, day },
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
