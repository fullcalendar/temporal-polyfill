import { DateBag } from '../internal/calendarFields'
import { NumSign, identityFunc } from '../internal/utils'
import { LocalesArg, prepCachedPlainDateFormat } from '../internal/formatIntl'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { DateTimeDisplayOptions, DiffOptions, OverflowOptions } from '../internal/optionsRefine'
import { DurationSlots, PlainDateSlots, PlainDateTimeSlots, PlainMonthDaySlots, PlainTimeSlots, PlainYearMonthSlots, ZonedDateTimeSlots, getCalendarIdFromBag, refineCalendarSlotString, refineTimeZoneSlotString } from '../internal/slots'
import * as Utils from './utils'
import { createNativeDateModOps, createNativeDateRefineOps, createNativeDiffOps, createNativeMonthDayRefineOps, createNativeMoveOps, createNativePartOps, createNativeYearMonthRefineOps } from '../internal/calendarNativeQuery'
import { createPlainDateSlots } from '../internal/slotsCreate'
import { parsePlainDate } from '../internal/parseIso'
import { plainDateWithFields, refinePlainDateBag } from '../internal/bag'
import { slotsWithCalendar } from '../internal/slotsMod'
import { movePlainDate } from '../internal/move'
import { diffPlainDates } from '../internal/diff'
import { plainDatesEqual, compareIsoDateFields } from '../internal/compare'
import { formatPlainDateIso } from '../internal/formatIso'
import { plainDateToPlainDateTime, plainDateToPlainMonthDay, plainDateToPlainYearMonth, plainDateToZonedDateTime } from '../internal/convert'

// TODO: do Readonly<> everywhere?

export function create(
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendar?: string,
): PlainDateSlots<string> {
  return createPlainDateSlots(refineCalendarSlotString, isoYear, isoMonth, isoDay, calendar)
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
export const getFields = Utils.getDateFields

// TODO: add specific types
export const dayOfWeek = Utils.dayOfWeek
export const daysInWeek = Utils.daysInWeek
export const weekOfYear = Utils.weekOfYear
export const yearOfWeek = Utils.yearOfWeek
export const dayOfYear = Utils.dayOfYear
export const daysInMonth = Utils.daysInMonth
export const daysInYear = Utils.daysInYear
export const monthsInYear = Utils.monthsInYear
export const inLeapYear = Utils.inLeapYear

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
    false,
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
    true,
    slots,
    durationSlots,
    options,
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
