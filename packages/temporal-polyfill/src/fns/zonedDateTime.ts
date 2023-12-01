import { DateBag, DateTimeBag, DateTimeFields, EraYearFields } from '../internal/calendarFields'
import { getCalendarIdFromBag, refineCalendarSlotString } from '../internal/calendarSlotString'
import { DurationFieldsWithSign } from '../internal/durationFields'
import { ZonedDateTimeBag } from '../internal/genericBag'
import { DiffOptions, OverflowOptions, RoundingOptions, ZonedDateTimeDisplayOptions, ZonedFieldOptions } from '../internal/options'
import { refineTimeZoneSlotString } from '../internal/timeZoneSlotString'
import { UnitName } from '../internal/units'
import { NumSign } from '../internal/utils'
import { PlainDateSlots, PlainDateTimeSlots, PlainMonthDaySlots, PlainTimeSlots, PlainYearMonthSlots, ZonedDateTimeSlots } from '../genericApi/genericTypes'
import { createDateNewCalendarRecordIMPL, createMonthDayNewCalendarRecordIMPL, createSimpleTimeZoneRecordIMPL, createTypicalTimeZoneRecordIMPL, createYearMonthNewCalendarRecordIMPL, getDateModCalendarRecordIMPL, getDiffCalendarRecordIMPL, getMoveCalendarRecordIMPL } from '../genericApi/recordCreators'
import { formatOffsetNano } from '../internal/isoFormat'
import { queryCalendarImpl } from '../internal/calendarImpl'
import { IsoDateTimeFields } from '../internal/isoFields'
import { zonedInternalsToIso } from '../internal/timeZoneMath'
import * as ZonedDateTimeFuncs from '../genericApi/zonedDateTime'

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
    createDateNewCalendarRecordIMPL,
    refineTimeZoneSlotString,
    createTypicalTimeZoneRecordIMPL,
    getCalendarIdFromBag(fields),
    fields,
    options,
  )
}

export function getISOFields(
  zonedDateTimeSlots: ZonedDateTimeSlots<string, string>,
): IsoDateTimeFields & { calendar: string, timeZone: string, offset: string } {
  return ZonedDateTimeFuncs.getISOFields(createSimpleTimeZoneRecordIMPL, zonedDateTimeSlots)
}

export type ZonedDateTimeFields = DateTimeFields & Partial<EraYearFields> & { offset: string }

export function getFields(
  zonedDateTimeSlots: ZonedDateTimeSlots<string, string>,
): ZonedDateTimeFields {
  const isoFields = zonedInternalsToIso(zonedDateTimeSlots, createSimpleTimeZoneRecordIMPL(zonedDateTimeSlots.timeZone))
  const offsetString = formatOffsetNano(isoFields.offsetNanoseconds)

  const calendarImpl = queryCalendarImpl(zonedDateTimeSlots.calendar)
  const [year, month, day] = calendarImpl.queryYearMonthDay(isoFields)

  return {
    era: calendarImpl.era(isoFields), // inefficient: requeries y/m/d
    eraYear: calendarImpl.eraYear(isoFields), // inefficient: requeries y/m/d
    year,
    month,
    monthCode: calendarImpl.monthCode(isoFields), // inefficient: requeries y/m/d
    day,
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

export function withFields(
  zonedDateTimeSlots: ZonedDateTimeSlots<string, string>,
  modFields: DateTimeBag,
  options?: ZonedFieldOptions,
): ZonedDateTimeSlots<string, string> {
  return ZonedDateTimeFuncs.withFields(
    getDateModCalendarRecordIMPL,
    createTypicalTimeZoneRecordIMPL,
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
    createTypicalTimeZoneRecordIMPL,
    zonedDateTimeSlots,
    plainTimeSlots,
  )
}

export function withPlainDate(
  zonedDateTimeSlots: ZonedDateTimeSlots<string, string>,
  plainDateSlots: PlainDateSlots<string>,
): ZonedDateTimeSlots<string, string> {
  return ZonedDateTimeFuncs.withPlainDate(
    createTypicalTimeZoneRecordIMPL,
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
  durationSlots: DurationFieldsWithSign,
  options?: OverflowOptions,
): ZonedDateTimeSlots<string, string> {
  return ZonedDateTimeFuncs.add(
    getMoveCalendarRecordIMPL,
    createTypicalTimeZoneRecordIMPL,
    zonedDateTimeSlots,
    durationSlots,
    options,
  )
}

export function subtract(
  zonedDateTimeSlots: ZonedDateTimeSlots<string, string>,
  durationSlots: DurationFieldsWithSign,
  options?: OverflowOptions,
): ZonedDateTimeSlots<string, string> {
  return ZonedDateTimeFuncs.subtract(
    getMoveCalendarRecordIMPL,
    createTypicalTimeZoneRecordIMPL,
    zonedDateTimeSlots,
    durationSlots,
    options,
  )
}

export function until(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
  zonedDateTimeSlots1: ZonedDateTimeSlots<string, string>,
  options?: DiffOptions,
): DurationFieldsWithSign {
  return ZonedDateTimeFuncs.until(
    getDiffCalendarRecordIMPL,
    createTypicalTimeZoneRecordIMPL,
    zonedDateTimeSlots0,
    zonedDateTimeSlots1,
    options,
  )
}

export function since(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
  zonedDateTimeSlots1: ZonedDateTimeSlots<string, string>,
  options?: DiffOptions,
): DurationFieldsWithSign {
  return ZonedDateTimeFuncs.since(
    getDiffCalendarRecordIMPL,
    createTypicalTimeZoneRecordIMPL,
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
    createTypicalTimeZoneRecordIMPL,
    zonedDateTimeSlots,
    options,
  )
}

export function startOfDay(
  zonedDateTimeSlots: ZonedDateTimeSlots<string, string>,
): ZonedDateTimeSlots<string, string> {
  return ZonedDateTimeFuncs.startOfDay(
    createTypicalTimeZoneRecordIMPL,
    zonedDateTimeSlots,
  )
}

export function hoursInDay(zonedDateTimeSlots: ZonedDateTimeSlots<string, string>): number {
  return ZonedDateTimeFuncs.hoursInDay(
    createTypicalTimeZoneRecordIMPL,
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
    createSimpleTimeZoneRecordIMPL,
    zonedDateTimeSlots0,
    options
  )
}

export function toJSON(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
): string {
  return ZonedDateTimeFuncs.toString(
    createSimpleTimeZoneRecordIMPL,
    zonedDateTimeSlots0,
  )
}

export function toPlainDate(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
): PlainDateSlots<string> {
  return ZonedDateTimeFuncs.toPlainDate(createSimpleTimeZoneRecordIMPL, zonedDateTimeSlots0)
}

export function toPlainTime(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
): PlainTimeSlots {
  return ZonedDateTimeFuncs.toPlainTime(createSimpleTimeZoneRecordIMPL, zonedDateTimeSlots0)
}

export function toPlainDateTime(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
): PlainDateTimeSlots<string> {
  return ZonedDateTimeFuncs.toPlainDateTime(createSimpleTimeZoneRecordIMPL, zonedDateTimeSlots0)
}

export function toPlainYearMonth(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
  zonedDateTimeFields: DateBag, // TODO: DateBag correct type?
): PlainYearMonthSlots<string> {
  return ZonedDateTimeFuncs.toPlainYearMonth(
    createYearMonthNewCalendarRecordIMPL,
    zonedDateTimeSlots0,
    zonedDateTimeFields,
  )
}

export function toPlainMonthDay(
  zonedDateTimeSlots0: ZonedDateTimeSlots<string, string>,
  zonedDateTimeFields: DateBag, // TODO: DateBag correct type?
): PlainMonthDaySlots<string> {
  return ZonedDateTimeFuncs.toPlainMonthDay(
    createMonthDayNewCalendarRecordIMPL,
    zonedDateTimeSlots0,
    zonedDateTimeFields,
  )
}
