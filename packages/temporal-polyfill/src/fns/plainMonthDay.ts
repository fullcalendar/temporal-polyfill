import { isoCalendarId } from '../internal/calendarConfig'
import { MonthDayBag, MonthDayFields, YearFields } from '../internal/calendarFields'
import { queryCalendarImpl } from '../internal/calendarImpl'
import { extractCalendarIdFromBag, refineCalendarSlotString } from '../internal/calendarSlotString'
import { DateTimeDisplayOptions, OverflowOptions } from '../internal/options'
import { PlainDateSlots, PlainMonthDaySlots } from '../genericApi/genericTypes'
import { createMonthDayModCalendarRecordIMPL, createMonthDayNewCalendarRecordIMPL, getDateModCalendarRecordIMPL } from '../genericApi/recordCreators'
import * as PlainMonthDayFuncs from '../genericApi/plainMonthDay'
import { DateTimeFormatSlots } from './dateTimeFormat'

export function create(
  isoMonth: number,
  isoDay: number,
  calendar?: string,
  referenceIsoYear?: number,
): PlainMonthDaySlots<string> {
  return PlainMonthDayFuncs.create(
    refineCalendarSlotString,
    isoMonth,
    isoDay,
    calendar,
    referenceIsoYear,
  )
}

export function fromString(s: string): PlainMonthDaySlots<string> {
  return PlainMonthDayFuncs.fromString(s) // just a passthrough
}

export function fromFields(
  fields: MonthDayBag & { calendar?: string },
  options?: OverflowOptions,
): PlainMonthDaySlots<string> {
  const calendarMaybe = extractCalendarIdFromBag(fields)
  const calendar = calendarMaybe || isoCalendarId // TODO: DRY-up this logic

  return PlainMonthDayFuncs.fromFields(
    createMonthDayNewCalendarRecordIMPL,
    calendar,
    !calendarMaybe,
    fields,
    options,
  )
}

export function getFields(slots: PlainMonthDaySlots<string>): MonthDayFields {
  const calendarImpl = queryCalendarImpl(slots.calendar)
  const [, month, day] = calendarImpl.queryYearMonthDay(slots)

  return {
    month,
    monthCode: calendarImpl.monthCode(slots),
    day,
  }
}

export function withFields(
  plainMonthDaySlots: PlainMonthDaySlots<string>,
  modFields: MonthDayBag,
  options?: OverflowOptions,
): PlainMonthDaySlots<string> {
  return PlainMonthDayFuncs.withFields(
    createMonthDayModCalendarRecordIMPL,
    plainMonthDaySlots,
    getFields(plainMonthDaySlots),
    modFields,
    options,
  )
}

export function equals(
  plainMonthDaySlots0: PlainMonthDaySlots<string>,
  plainMonthDaySlots1: PlainMonthDaySlots<string>,
): boolean {
  return PlainMonthDayFuncs.equals(plainMonthDaySlots0, plainMonthDaySlots1)
}

export function toString(
  plainMonthDaySlots: PlainMonthDaySlots<string>,
  options?: DateTimeDisplayOptions,
): string {
  return PlainMonthDayFuncs.toString(plainMonthDaySlots, options)
}

export function toJSON(
  plainMonthDaySlots: PlainMonthDaySlots<string>,
): string {
  return PlainMonthDayFuncs.toJSON(plainMonthDaySlots)
}

export function toPlainDate(
  plainMonthDaySlots: PlainMonthDaySlots<string>,
  bag: YearFields,
): PlainDateSlots<string> {
  return PlainMonthDayFuncs.toPlainDate(
    getDateModCalendarRecordIMPL,
    plainMonthDaySlots,
    getFields(plainMonthDaySlots),
    bag,
  )
}

// DateTimeFormat
// --------------

export function format(format: DateTimeFormatSlots, slots: PlainMonthDaySlots<string>): string {
  return '' // TODO
}

export function formatRange(
  format: DateTimeFormatSlots,
  slots0: PlainMonthDaySlots<string>,
  slots1: PlainMonthDaySlots<string>
): string {
  return '' // TODO
}
