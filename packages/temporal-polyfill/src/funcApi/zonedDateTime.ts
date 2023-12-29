import { DateBag, DateTimeBag, DateTimeFields, EraYearFields } from '../internal/calendarFields'
import { UnitName } from '../internal/units'
import { NumSign } from '../internal/utils'
import { formatOffsetNano, formatZonedDateTimeIso } from '../internal/formatIso'
import { ZonedIsoDateTimeSlots, computeHoursInDay, computeStartOfDay, getZonedIsoDateTimeSlots, zonedInternalsToIso } from '../internal/timeZoneOps'
import { LocalesArg, prepCachedZonedDateTimeFormat } from '../internal/formatIntl'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { DiffOptions, OverflowOptions, RoundingOptions, ZonedDateTimeDisplayOptions, ZonedFieldOptions } from '../internal/optionsRefine'
import { DurationSlots, PlainDateSlots, PlainDateTimeSlots, PlainMonthDaySlots, PlainTimeSlots, PlainYearMonthSlots, ZonedDateTimeSlots, getCalendarIdFromBag, refineCalendarSlotString, refineTimeZoneSlotString } from '../internal/slots'
import * as Utils from './utils'
import { computeIsoDayOfWeek, computeIsoDaysInWeek, computeIsoWeekOfYear, computeIsoYearOfWeek } from '../internal/calendarIso'
import { createNativeDateModOps, createNativeDateRefineOps, createNativeDiffOps, createNativeMonthDayRefineOps, createNativeMoveOps, createNativeYearMonthRefineOps } from '../internal/calendarNativeQuery'
import { DurationFields } from '../internal/durationFields'
import { ZonedDateTimeBag, refineZonedDateTimeBag, zonedDateTimeWithFields } from '../internal/bag'
import { createZonedDateTimeSlots } from '../internal/slotsCreate'
import { parseZonedDateTime } from '../internal/parseIso'
import { slotsWithTimeZone, zonedDateTimeWithPlainDate, zonedDateTimeWithPlainTime } from '../internal/slotsMod'
import { moveZonedDateTime } from '../internal/move'
import { diffZonedDateTimes } from '../internal/diff'
import { roundZonedDateTime } from '../internal/round'
import { compareZonedDateTimes, zonedDateTimesEqual } from '../internal/compare'
import { zonedDateTimeToPlainDate, zonedDateTimeToPlainDateTime, zonedDateTimeToPlainMonthDay, zonedDateTimeToPlainTime, zonedDateTimeToPlainYearMonth } from '../internal/convert'

export function create(
  epochNano: bigint,
  timeZoneArg: string,
  calendarArg?: string,
): ZonedDateTimeSlots<string, string> {
  return createZonedDateTimeSlots(
    refineCalendarSlotString,
    refineTimeZoneSlotString,
    epochNano,
    timeZoneArg,
    calendarArg,
  )
}

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

export function getISOFields(
  zonedDateTimeSlots: ZonedDateTimeSlots<string, string>,
): ZonedIsoDateTimeSlots<string, string> {
  return getZonedIsoDateTimeSlots(queryNativeTimeZone, zonedDateTimeSlots)
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
  return zonedDateTimeWithFields(
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
  return zonedDateTimeWithPlainTime(
    queryNativeTimeZone,
    zonedDateTimeSlots,
    plainTimeSlots,
  )
}

export function withPlainDate(
  zonedDateTimeSlots: ZonedDateTimeSlots<string, string>,
  plainDateSlots: PlainDateSlots<string>,
): ZonedDateTimeSlots<string, string> {
  return zonedDateTimeWithPlainDate(
    queryNativeTimeZone,
    zonedDateTimeSlots,
    plainDateSlots,
  )
}

export const withTimeZone = slotsWithTimeZone

export const withCalendar = slotsWithTimeZone

export function add(
  zonedDateTimeSlots: ZonedDateTimeSlots<string, string>,
  durationSlots: DurationSlots,
  options?: OverflowOptions,
): ZonedDateTimeSlots<string, string> {
  return moveZonedDateTime(
    createNativeMoveOps,
    queryNativeTimeZone,
    false,
    zonedDateTimeSlots,
    durationSlots,
    options,
  )
}

export function subtract(
  zonedDateTimeSlots: ZonedDateTimeSlots<string, string>,
  durationSlots: DurationSlots,
  options?: OverflowOptions,
): ZonedDateTimeSlots<string, string> {
  return moveZonedDateTime(
    createNativeMoveOps,
    queryNativeTimeZone,
    true,
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
  return diffZonedDateTimes(
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
  return diffZonedDateTimes(
    createNativeDiffOps,
    queryNativeTimeZone,
    zonedDateTimeSlots0,
    zonedDateTimeSlots1,
    options,
    true,
  )
}

export function round(
  zonedDateTimeSlots: ZonedDateTimeSlots<string, string>,
  options: RoundingOptions | UnitName,
): ZonedDateTimeSlots<string, string> {
  return roundZonedDateTime(
    queryNativeTimeZone,
    zonedDateTimeSlots,
    options,
  )
}

export function startOfDay(
  zonedDateTimeSlots: ZonedDateTimeSlots<string, string>,
): ZonedDateTimeSlots<string, string> {
  return computeStartOfDay(
    queryNativeTimeZone,
    zonedDateTimeSlots,
  )
}

export function hoursInDay(zonedDateTimeSlots: ZonedDateTimeSlots<string, string>): number {
  return computeHoursInDay(
    queryNativeTimeZone,
    zonedDateTimeSlots,
  )
}

export function compare(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
  zonedDateTimeSlots1: ZonedDateTimeSlots<string, string>,
): NumSign {
  return compareZonedDateTimes(zonedDateTimeSlots0, zonedDateTimeSlots1) // just forwards
}

export function equals(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
  zonedDateTimeSlots1: ZonedDateTimeSlots<string, string>,
): boolean {
  return zonedDateTimesEqual(zonedDateTimeSlots0, zonedDateTimeSlots1) // just forwards
}

export function toString(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
  options?: ZonedDateTimeDisplayOptions,
): string {
  return formatZonedDateTimeIso(
    queryNativeTimeZone,
    zonedDateTimeSlots0,
    options
  )
}

export function toPlainDate(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
): PlainDateSlots<string> {
  return zonedDateTimeToPlainDate(queryNativeTimeZone, zonedDateTimeSlots0)
}

export function toPlainTime(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
): PlainTimeSlots {
  return zonedDateTimeToPlainTime(queryNativeTimeZone, zonedDateTimeSlots0)
}

export function toPlainDateTime(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
): PlainDateTimeSlots<string> {
  return zonedDateTimeToPlainDateTime(queryNativeTimeZone, zonedDateTimeSlots0)
}

export function toPlainYearMonth(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
  zonedDateTimeFields: DateBag, // TODO: DateBag correct type?
): PlainYearMonthSlots<string> {
  return zonedDateTimeToPlainYearMonth(
    createNativeYearMonthRefineOps,
    zonedDateTimeSlots0,
    zonedDateTimeFields,
  )
}

export function toPlainMonthDay(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
  zonedDateTimeFields: DateBag, // TODO: DateBag correct type?
): PlainMonthDaySlots<string> {
  return zonedDateTimeToPlainMonthDay(
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
