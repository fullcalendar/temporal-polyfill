import { DateTimeDisplayOptions, DiffOptions, OverflowOptions } from '../internal/options'
import { DateBag, DateFields, EraYearFields } from '../internal/calendarFields'
import { queryCalendarImpl } from '../internal/calendarImpl'
import { NumSign } from '../internal/utils'
import { getCalendarIdFromBag, refineCalendarSlotString } from '../internal/calendarSlotString'
import { refineTimeZoneSlotString } from '../internal/timeZoneSlotString'
import { createDateNewCalendarRecordIMPL, createMonthDayNewCalendarRecordIMPL, createTypicalTimeZoneRecordIMPL, createYearMonthNewCalendarRecordIMPL, getDateModCalendarRecordIMPL, getDiffCalendarRecordIMPL, getMoveCalendarRecordIMPL } from '../genericApi/recordCreators'
import { DurationSlots, PlainDateSlots, PlainDateTimeSlots, PlainMonthDaySlots, PlainTimeSlots, PlainYearMonthSlots, ZonedDateTimeSlots } from '../genericApi/genericTypes'
import * as PlainDateFuncs from '../genericApi/plainDate'
import { DateTimeFormatSlots } from './dateTimeFormat'

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
  options: OverflowOptions,
): PlainDateSlots<string> {
  return PlainDateFuncs.fromFields(
    createDateNewCalendarRecordIMPL,
    getCalendarIdFromBag(fields),
    fields,
    options,
  )
}

export function getFields(slots: PlainDateSlots<string>): DateFields & Partial<EraYearFields> {
  const calendarImpl = queryCalendarImpl(slots.calendar)
  const [year, month, day] = calendarImpl.queryYearMonthDay(slots)

  return {
    era: calendarImpl.era(slots), // inefficient: requeries y/m/d
    eraYear: calendarImpl.eraYear(slots), // inefficient: requeries y/m/d
    year,
    month,
    monthCode: calendarImpl.monthCode(slots), // inefficient: requeries y/m/d
    day,
  }
}

export function withFields(
  slots: PlainDateSlots<string>,
  newFields: DateBag,
  options: OverflowOptions,
): PlainDateSlots<string> {
  return PlainDateFuncs.withFields(
    getDateModCalendarRecordIMPL,
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
    getMoveCalendarRecordIMPL,
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
    getMoveCalendarRecordIMPL,
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
    getDiffCalendarRecordIMPL,
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
    getDiffCalendarRecordIMPL,
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
    createTypicalTimeZoneRecordIMPL,
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
  const calenadarImpl = queryCalendarImpl(slots.calendar)
  const [year, month, day] = calenadarImpl.queryYearMonthDay(slots)

  return PlainDateFuncs.toPlainYearMonth(
    createYearMonthNewCalendarRecordIMPL,
    slots,
    { year, month, day },
  )
}

export function toPlainMonthDay(slots: PlainDateSlots<string>): PlainMonthDaySlots<string> {
  const calenadarImpl = queryCalendarImpl(slots.calendar)
  const [year, month, day] = calenadarImpl.queryYearMonthDay(slots)

  return PlainDateFuncs.toPlainMonthDay(
    createMonthDayNewCalendarRecordIMPL,
    slots,
    { year, month, day },
  )
}

// DateTimeFormat
// --------------

export function format(format: DateTimeFormatSlots, slots: PlainDateSlots<string>): string {
  return '' // TODO
}

export function formatRange(
  format: DateTimeFormatSlots,
  slots0: PlainDateSlots<string>,
  slots1: PlainDateSlots<string>
): string {
  return '' // TODO
}
