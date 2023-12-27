import { DateBag, DateTimeBag, DateTimeFields, EraYearFields } from '../internal/calendarFields'
import { UnitName } from '../internal/units'
import { NumSign } from '../internal/utils'
import { formatOffsetNano } from '../internal/formatIso'
import { IsoDateTimeFields } from '../internal/calendarIsoFields'
import { zonedInternalsToIso } from '../internal/timeZoneOps'
import { LocalesArg, prepCachedZonedDateTimeFormat } from '../internal/formatIntl'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { DiffOptions, OverflowOptions, RoundingOptions, ZonedDateTimeDisplayOptions, ZonedFieldOptions } from '../internal/optionsRefine'
import { PlainDateSlots, PlainDateTimeSlots, PlainMonthDaySlots, PlainTimeSlots, PlainYearMonthSlots, ZonedDateTimeSlots, getCalendarIdFromBag, refineCalendarSlotString, refineTimeZoneSlotString } from '../internal/slots'
import * as ZonedDateTimeFuncs from '../genericApi/zonedDateTime'
import * as Utils from './utils'
import { computeIsoDayOfWeek, computeIsoDaysInWeek, computeIsoWeekOfYear, computeIsoYearOfWeek } from '../internal/calendarIso'
import { createNativeDateModOps, createNativeDateRefineOps, createNativeDiffOps, createNativeMonthDayRefineOps, createNativeMoveOps, createNativeYearMonthRefineOps } from '../internal/calendarNativeQuery'
import { DurationFields } from '../internal/durationFields'
import { ZonedDateTimeBag } from '../internal/bag'

export function create(
  epochNano: bigint,
  timeZoneArg: string,
  calendarArg?: string,
): ZonedDateTimeSlots<string, string> {
  return ZonedDateTimeFuncs.create(
    refineCalendarSlotString,
    refineTimeZoneSlotString,
    epochNano,
    timeZoneArg,
    calendarArg,
  )
}

export function fromString(s: string): ZonedDateTimeSlots<string, string> {
  return ZonedDateTimeFuncs.fromString(s) // NOTE: just forwards
}

export function fromFields(
  fields: ZonedDateTimeBag<string, string>,
  options?: ZonedFieldOptions,
): ZonedDateTimeSlots<string, string> {
  return ZonedDateTimeFuncs.fromFields(
    createNativeDateRefineOps,
    refineTimeZoneSlotString,
    queryNativeTimeZone,
    getCalendarIdFromBag(fields),
    fields,
    options,
  )
}

export function getISOFields(
  zonedDateTimeSlots: ZonedDateTimeSlots<string, string>,
): IsoDateTimeFields & { calendar: string, timeZone: string, offset: string } {
  return ZonedDateTimeFuncs.getISOFields(queryNativeTimeZone, zonedDateTimeSlots)
}

export type ZonedDateTimeFields = DateTimeFields & Partial<EraYearFields> & { offset: string }

export function getFields(
  zonedDateTimeSlots: ZonedDateTimeSlots<string, string>,
): ZonedDateTimeFields {
  const isoFields = zonedInternalsToIso(zonedDateTimeSlots, queryNativeTimeZone(zonedDateTimeSlots.timeZone))
  const offsetString = formatOffsetNano(isoFields.offsetNanoseconds)

  return {
    ...Utils.getDateFields({ ...isoFields, calendar: zonedDateTimeSlots.calendar }),
    // TODO: util for time...
    hour: isoFields.isoHour,
    minute: isoFields.isoMinute,
    second: isoFields.isoSecond,
    millisecond: isoFields.isoMillisecond,
    microsecond: isoFields.isoMicrosecond,
    nanosecond: isoFields.isoNanosecond,
    offset: offsetString,
  }
}

export function dayOfWeek(zonedDateTimeSlots: ZonedDateTimeSlots<string, string>): number {
  const isoFields = zonedInternalsToIso(zonedDateTimeSlots, queryNativeTimeZone(zonedDateTimeSlots.timeZone))
  return computeIsoDayOfWeek(isoFields)
}

export function daysInWeek(zonedDateTimeSlots: ZonedDateTimeSlots<string, string>): number {
  const isoFields = zonedInternalsToIso(zonedDateTimeSlots, queryNativeTimeZone(zonedDateTimeSlots.timeZone))
  return computeIsoDaysInWeek(isoFields)
}

export function weekOfYear(zonedDateTimeSlots: ZonedDateTimeSlots<string, string>): number {
  const isoFields = zonedInternalsToIso(zonedDateTimeSlots, queryNativeTimeZone(zonedDateTimeSlots.timeZone))
  return computeIsoWeekOfYear(isoFields)
}

export function yearOfWeek(zonedDateTimeSlots: ZonedDateTimeSlots<string, string>): number {
  const isoFields = zonedInternalsToIso(zonedDateTimeSlots, queryNativeTimeZone(zonedDateTimeSlots.timeZone))
  return computeIsoYearOfWeek(isoFields)
}

export function dayOfYear(zonedDateTimeSlots: ZonedDateTimeSlots<string, string>): number {
  const isoFields = zonedInternalsToIso(zonedDateTimeSlots, queryNativeTimeZone(zonedDateTimeSlots.timeZone))
  return Utils.dayOfYear({ ...isoFields, calendar: zonedDateTimeSlots.calendar })
}

export function daysInMonth(zonedDateTimeSlots: ZonedDateTimeSlots<string, string>): number {
  const isoFields = zonedInternalsToIso(zonedDateTimeSlots, queryNativeTimeZone(zonedDateTimeSlots.timeZone))
  return Utils.daysInMonth({ ...isoFields, calendar: zonedDateTimeSlots.calendar })
}

export function daysInYear(zonedDateTimeSlots: ZonedDateTimeSlots<string, string>): number {
  const isoFields = zonedInternalsToIso(zonedDateTimeSlots, queryNativeTimeZone(zonedDateTimeSlots.timeZone))
  return Utils.daysInYear({ ...isoFields, calendar: zonedDateTimeSlots.calendar })
}

export function monthsInYear(zonedDateTimeSlots: ZonedDateTimeSlots<string, string>): number {
  const isoFields = zonedInternalsToIso(zonedDateTimeSlots, queryNativeTimeZone(zonedDateTimeSlots.timeZone))
  return Utils.monthsInYear({ ...isoFields, calendar: zonedDateTimeSlots.calendar })
}

export function inLeapYear(zonedDateTimeSlots: ZonedDateTimeSlots<string, string>): boolean {
  const isoFields = zonedInternalsToIso(zonedDateTimeSlots, queryNativeTimeZone(zonedDateTimeSlots.timeZone))
  return Utils.inLeapYear({ ...isoFields, calendar: zonedDateTimeSlots.calendar })
}

export function withFields(
  zonedDateTimeSlots: ZonedDateTimeSlots<string, string>,
  modFields: DateTimeBag,
  options?: ZonedFieldOptions,
): ZonedDateTimeSlots<string, string> {
  return ZonedDateTimeFuncs.withFields(
    createNativeDateModOps,
    queryNativeTimeZone,
    zonedDateTimeSlots,
    getFields(zonedDateTimeSlots),
    modFields,
    options,
  )
}

export function withPlainTime(
  zonedDateTimeSlots: ZonedDateTimeSlots<string, string>,
  plainTimeSlots: PlainTimeSlots,
): ZonedDateTimeSlots<string, string> {
  return ZonedDateTimeFuncs.withPlainTime(
    queryNativeTimeZone,
    zonedDateTimeSlots,
    plainTimeSlots,
  )
}

export function withPlainDate(
  zonedDateTimeSlots: ZonedDateTimeSlots<string, string>,
  plainDateSlots: PlainDateSlots<string>,
): ZonedDateTimeSlots<string, string> {
  return ZonedDateTimeFuncs.withPlainDate(
    queryNativeTimeZone,
    zonedDateTimeSlots,
    plainDateSlots,
  )
}

export function withTimeZone(
  zonedDateTimeSlots: ZonedDateTimeSlots<string, string>,
  timeZoneId: string,
): ZonedDateTimeSlots<string, string> {
  return ZonedDateTimeFuncs.withTimeZone(zonedDateTimeSlots, timeZoneId) // just forwards
}

export function withCalendar(
  zonedDateTimeSlots: ZonedDateTimeSlots<string, string>,
  calendarId: string,
): ZonedDateTimeSlots<string, string> {
  return ZonedDateTimeFuncs.withTimeZone(zonedDateTimeSlots, calendarId) // just forwards
}

export function add(
  zonedDateTimeSlots: ZonedDateTimeSlots<string, string>,
  durationSlots: DurationFields,
  options?: OverflowOptions,
): ZonedDateTimeSlots<string, string> {
  return ZonedDateTimeFuncs.add(
    createNativeMoveOps,
    queryNativeTimeZone,
    zonedDateTimeSlots,
    durationSlots,
    options,
  )
}

export function subtract(
  zonedDateTimeSlots: ZonedDateTimeSlots<string, string>,
  durationSlots: DurationFields,
  options?: OverflowOptions,
): ZonedDateTimeSlots<string, string> {
  return ZonedDateTimeFuncs.subtract(
    createNativeMoveOps,
    queryNativeTimeZone,
    zonedDateTimeSlots,
    durationSlots,
    options,
  )
}

export function until(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
  zonedDateTimeSlots1: ZonedDateTimeSlots<string, string>,
  options?: DiffOptions,
): DurationFields {
  return ZonedDateTimeFuncs.until(
    createNativeDiffOps,
    queryNativeTimeZone,
    zonedDateTimeSlots0,
    zonedDateTimeSlots1,
    options,
  )
}

export function since(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
  zonedDateTimeSlots1: ZonedDateTimeSlots<string, string>,
  options?: DiffOptions,
): DurationFields {
  return ZonedDateTimeFuncs.since(
    createNativeDiffOps,
    queryNativeTimeZone,
    zonedDateTimeSlots0,
    zonedDateTimeSlots1,
    options,
  )
}

export function round(
  zonedDateTimeSlots: ZonedDateTimeSlots<string, string>,
  options: RoundingOptions | UnitName,
): ZonedDateTimeSlots<string, string> {
  return ZonedDateTimeFuncs.round(
    queryNativeTimeZone,
    zonedDateTimeSlots,
    options,
  )
}

export function startOfDay(
  zonedDateTimeSlots: ZonedDateTimeSlots<string, string>,
): ZonedDateTimeSlots<string, string> {
  return ZonedDateTimeFuncs.startOfDay(
    queryNativeTimeZone,
    zonedDateTimeSlots,
  )
}

export function hoursInDay(zonedDateTimeSlots: ZonedDateTimeSlots<string, string>): number {
  return ZonedDateTimeFuncs.hoursInDay(
    queryNativeTimeZone,
    zonedDateTimeSlots,
  )
}

export function compare(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
  zonedDateTimeSlots1: ZonedDateTimeSlots<string, string>,
): NumSign {
  return ZonedDateTimeFuncs.compare(zonedDateTimeSlots0, zonedDateTimeSlots1) // just forwards
}

export function equals(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
  zonedDateTimeSlots1: ZonedDateTimeSlots<string, string>,
): boolean {
  return ZonedDateTimeFuncs.equals(zonedDateTimeSlots0, zonedDateTimeSlots1) // just forwards
}

export function toString(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
  options?: ZonedDateTimeDisplayOptions,
): string {
  return ZonedDateTimeFuncs.toString(
    queryNativeTimeZone,
    zonedDateTimeSlots0,
    options
  )
}

export function toJSON(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
): string {
  return ZonedDateTimeFuncs.toString(
    queryNativeTimeZone,
    zonedDateTimeSlots0,
  )
}

export function toPlainDate(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
): PlainDateSlots<string> {
  return ZonedDateTimeFuncs.toPlainDate(queryNativeTimeZone, zonedDateTimeSlots0)
}

export function toPlainTime(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
): PlainTimeSlots {
  return ZonedDateTimeFuncs.toPlainTime(queryNativeTimeZone, zonedDateTimeSlots0)
}

export function toPlainDateTime(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
): PlainDateTimeSlots<string> {
  return ZonedDateTimeFuncs.toPlainDateTime(queryNativeTimeZone, zonedDateTimeSlots0)
}

export function toPlainYearMonth(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
  zonedDateTimeFields: DateBag, // TODO: DateBag correct type?
): PlainYearMonthSlots<string> {
  return ZonedDateTimeFuncs.toPlainYearMonth(
    createNativeYearMonthRefineOps,
    zonedDateTimeSlots0,
    zonedDateTimeFields,
  )
}

export function toPlainMonthDay(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
  zonedDateTimeFields: DateBag, // TODO: DateBag correct type?
): PlainMonthDaySlots<string> {
  return ZonedDateTimeFuncs.toPlainMonthDay(
    createNativeMonthDayRefineOps,
    zonedDateTimeSlots0,
    zonedDateTimeFields,
  )
}

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
