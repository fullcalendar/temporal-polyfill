import { DateTimeBag, DateTimeFields, EraYearFields } from '../internal/calendarFields'
import { LocalesArg } from '../internal/formatIntl'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { DiffOptions, EpochDisambigOptions, OverflowOptions } from '../internal/optionsRefine'
import { DurationSlots, PlainDateTimeSlots, PlainMonthDaySlots, PlainYearMonthSlots, ZonedDateTimeSlots, refineCalendarSlotString } from '../internal/slots'
import * as Utils from './utils'
import { createNativeDateModOps, createNativeDiffOps, createNativeMonthDayRefineOps, createNativeMoveOps, createNativePartOps, createNativeYearMonthRefineOps } from '../internal/calendarNativeQuery'
import { createPlainDateTimeSlots } from '../internal/slotsCreate'
import { parsePlainDateTime } from '../internal/parseIso'
import { plainDateTimeWithFields, refinePlainDateTimeBag } from '../internal/bag'
import { plainDateTimeWithPlainDate, plainDateTimeWithPlainTime, slotsWithCalendar } from '../internal/slotsMod'
import { movePlainDateTime } from '../internal/move'
import { diffPlainDateTimes } from '../internal/diff'
import { roundPlainDateTime } from '../internal/round'
import { plainDateTimesEqual, compareIsoDateTimeFields } from '../internal/compare'
import { formatPlainDateTimeIso } from '../internal/formatIso'
import { plainDateTimeToPlainDate, plainDateTimeToPlainMonthDay, plainDateTimeToPlainTime, plainDateTimeToPlainYearMonth, plainDateTimeToZonedDateTime } from '../internal/convert'
import { prepCachedPlainDateTimeFormat } from './formatIntlCached'

// TODO: do Readonly<> everywhere?

export function create(
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
): PlainDateTimeSlots<string> {
  return createPlainDateTimeSlots(
    refineCalendarSlotString,
    isoYear, isoMonth, isoDay,
    isoHour, isoMinute, isoSecond,
    isoMillisecond, isoMicrosecond, isoNanosecond,
    calendar,
  )
}

export const fromString = parsePlainDateTime

export const fromFields = refinePlainDateTimeBag

export function getFields(slots: PlainDateTimeSlots<string>): DateTimeFields & Partial<EraYearFields> {
  return {
    ...Utils.getDateFields(slots),
    // TODO: util for time...
    hour: slots.isoHour,
    minute: slots.isoMinute,
    second: slots.isoSecond,
    millisecond: slots.isoMillisecond,
    microsecond: slots.isoMicrosecond,
    nanosecond: slots.isoNanosecond,
  }
}

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
  plainDateTimeSlots: PlainDateTimeSlots<string>,
  newFields: DateTimeBag,
  options?: OverflowOptions,
): PlainDateTimeSlots<string> {
  return plainDateTimeWithFields(
    createNativeDateModOps,
    plainDateTimeSlots,
    getFields(plainDateTimeSlots), // TODO: just use y/m/d?
    newFields,
    options,
  )
}

export const withPlainTime = plainDateTimeWithPlainTime

export const withPlainDate = plainDateTimeWithPlainDate

export function withCalendar(
  plainDateTimeSlots: PlainDateTimeSlots<string>,
  calendarId: string,
): PlainDateTimeSlots<string> {
  return slotsWithCalendar(
    plainDateTimeSlots,
    refineCalendarSlotString(calendarId),
  )
}

export function add(
  plainDateTimeSlots: PlainDateTimeSlots<string>,
  durationSlots: DurationSlots,
  options?: OverflowOptions,
): PlainDateTimeSlots<string> {
  return movePlainDateTime(createNativeMoveOps, false, plainDateTimeSlots, durationSlots, options)
}

export function subtract(
  plainDateTimeSlots: PlainDateTimeSlots<string>,
  durationSlots: DurationSlots,
  options?: OverflowOptions,
): PlainDateTimeSlots<string> {
  return movePlainDateTime(createNativeMoveOps, true, plainDateTimeSlots, durationSlots, options)
}

export function until(
  plainDateTimeSlots0: PlainDateTimeSlots<string>,
  plainDateTimeSlots1: PlainDateTimeSlots<string>,
  options?: DiffOptions,
): DurationSlots {
  return diffPlainDateTimes(createNativeDiffOps, plainDateTimeSlots0, plainDateTimeSlots1, options)
}

export function since(
  plainDateTimeSlots0: PlainDateTimeSlots<string>,
  plainDateTimeSlots1: PlainDateTimeSlots<string>,
  options?: DiffOptions,
): DurationSlots {
  return diffPlainDateTimes(createNativeDiffOps, plainDateTimeSlots0, plainDateTimeSlots1, options, true)
}

export const round = roundPlainDateTime

export const compare = compareIsoDateTimeFields

export const equals = plainDateTimesEqual

export const toString = formatPlainDateTimeIso

export function toZonedDateTime(
  plainDateTimeSlots: PlainDateTimeSlots<string>,
  timeZoneId: string,
  options?: EpochDisambigOptions,
): ZonedDateTimeSlots<string, string> {
  return plainDateTimeToZonedDateTime(queryNativeTimeZone, plainDateTimeSlots, timeZoneId, options)
}

export const toPlainDate = plainDateTimeToPlainDate

export function toPlainYearMonth(
  plainDateTimeSlots: PlainDateTimeSlots<string>,
): PlainYearMonthSlots<string> {
  const calendarOps = createNativePartOps(plainDateTimeSlots.calendar)
  const [year, month, day] = calendarOps.dateParts(plainDateTimeSlots) // TODO: DRY

  return plainDateTimeToPlainYearMonth(
    createNativeYearMonthRefineOps,
    plainDateTimeSlots,
    { year, month, day },
  )
}

export function toPlainMonthDay(
  plainDateTimeSlots: PlainDateTimeSlots<string>,
): PlainMonthDaySlots<string> {
  const calendarOps = createNativePartOps(plainDateTimeSlots.calendar)
  const [year, month, day] = calendarOps.dateParts(plainDateTimeSlots) // TODO: DRY

  return plainDateTimeToPlainMonthDay(
    createNativeMonthDayRefineOps,
    plainDateTimeSlots,
    { year, month, day },
  )
}

export const toPlainTime = plainDateTimeToPlainTime

export function toLocaleString(
  slots: PlainDateTimeSlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepCachedPlainDateTimeFormat(locales, options, slots)
  return format.format(epochMilli)
}

export function toLocaleStringParts(
  slots: PlainDateTimeSlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli] = prepCachedPlainDateTimeFormat(locales, options, slots)
  return format.formatToParts(epochMilli)
}

export function rangeToLocaleString(
  slots0: PlainDateTimeSlots<string>,
  slots1: PlainDateTimeSlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli0, epochMilli1] = prepCachedPlainDateTimeFormat(locales, options, slots0, slots1)
  return (format as any).formatRange(epochMilli0, epochMilli1!)
}

export function rangeToLocaleStringParts(
  slots0: PlainDateTimeSlots<string>,
  slots1: PlainDateTimeSlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
  ): Intl.DateTimeFormatPart[] {
  const [format, epochMilli0, epochMilli1] = prepCachedPlainDateTimeFormat(locales, options, slots0, slots1)
  return (format as any).formatRangeToParts(epochMilli0, epochMilli1!)
}
