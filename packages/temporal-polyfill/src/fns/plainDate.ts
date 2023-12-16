import { DateBag } from '../internal/calendarFields'
import { NumSign } from '../internal/utils'
import { LocalesArg, prepCachedPlainDateFormat } from '../internal/formatIntl'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { DateTimeDisplayOptions, DiffOptions, OverflowOptions } from '../genericApi/optionsRefine'
import { refineTimeZoneSlotString } from '../genericApi/timeZoneSlotString'
import { getCalendarIdFromBag, refineCalendarSlotString } from '../genericApi/calendarSlotString'
import { DurationSlots, PlainDateSlots, PlainDateTimeSlots, PlainMonthDaySlots, PlainTimeSlots, PlainYearMonthSlots, ZonedDateTimeSlots } from '../genericApi/slotsGeneric'
import * as PlainDateFuncs from '../genericApi/plainDate'
import * as Utils from './utils'
import { createNativeDateModOps, createNativeDateRefineOps, createNativeDiffOps, createNativeMonthDayRefineOps, createNativeMoveOps, createNativePartOps, createNativeYearMonthRefineOps } from '../internal/calendarNativeQuery'

// TODO: do Readonly<> everywhere?

export function create(
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendar?: string,
): PlainDateSlots<string> {
  return PlainDateFuncs.create(refineCalendarSlotString, isoYear, isoMonth, isoDay, calendar)
}

export function fromString(s: string): PlainDateSlots<string> {
  return PlainDateFuncs.fromString(s) // NOTE: just forwards
}

export function fromFields(
  fields: DateBag & { calendar?: string },
  options?: OverflowOptions,
): PlainDateSlots<string> {
  return PlainDateFuncs.fromFields(
    createNativeDateRefineOps,
    getCalendarIdFromBag(fields),
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
  return PlainDateFuncs.withFields(
    createNativeDateModOps,
    slots,
    getFields(slots), // TODO: just use y/m/d?
    newFields,
    options,
  )
}

// TODO: more DRY
export function withCalendar(
  slots: PlainDateSlots<string>,
  calendarId: string,
): PlainDateSlots<string> {
  return {
    ...slots,
    calendar: refineCalendarSlotString(calendarId)
  }
}

export function add(
  slots: PlainDateSlots<string>,
  durationSlots: DurationSlots,
  options?: OverflowOptions,
): PlainDateSlots<string> {
  return PlainDateFuncs.add(
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
  return PlainDateFuncs.subtract(
    createNativeMoveOps,
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
  return PlainDateFuncs.until(
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
  return PlainDateFuncs.since(
    createNativeDiffOps,
    slots0,
    slots1,
    options,
  )
}

export function compare(slots0: PlainDateSlots<string>, slots1: PlainDateSlots<string>): NumSign {
  return PlainDateFuncs.compare(slots0, slots1) // NOTE: just forwards
}

export function equals(slots0: PlainDateSlots<string>, slots1: PlainDateSlots<string>): boolean {
  return PlainDateFuncs.equals(slots0, slots1) // NOTE: just forwards
}

export function toString(slots: PlainDateSlots<string>, options?: DateTimeDisplayOptions): string {
  return PlainDateFuncs.toString(slots, options) // NOTE: just forwards
}

export function toZonedDateTime(
  slots: PlainDateSlots<string>,
  options: string | { timeZone: string, plainTime?: PlainTimeSlots },
): ZonedDateTimeSlots<string, string> {
  let timeZoneArg: string
  let plainTimeArg: PlainTimeSlots | undefined

  if (typeof options === 'string') {
    timeZoneArg = options
  } else {
    timeZoneArg = options.timeZone
    plainTimeArg = options.plainTime
  }

  return PlainDateFuncs.toZonedDateTime(
    queryNativeTimeZone,
    slots,
    refineTimeZoneSlotString(timeZoneArg),
    plainTimeArg,
  )
}

export function toPlainDateTime(
  slots: PlainDateSlots<string>,
  plainTime?: PlainTimeSlots,
): PlainDateTimeSlots<string> {
  return PlainDateFuncs.toPlainDateTime(slots, plainTime) // NOTE: just forwards
}

export function toPlainYearMonth(slots: PlainDateSlots<string>): PlainYearMonthSlots<string> {
  const calenadarOps = createNativePartOps(slots.calendar)
  const [year, month, day] = calenadarOps.dateParts(slots) // TODO: DRY

  return PlainDateFuncs.toPlainYearMonth(
    createNativeYearMonthRefineOps,
    slots,
    { year, month, day },
  )
}

export function toPlainMonthDay(slots: PlainDateSlots<string>): PlainMonthDaySlots<string> {
  const calenadarOps = createNativePartOps(slots.calendar)
  const [year, month, day] = calenadarOps.dateParts(slots) // TODO: DRY

  return PlainDateFuncs.toPlainMonthDay(
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
