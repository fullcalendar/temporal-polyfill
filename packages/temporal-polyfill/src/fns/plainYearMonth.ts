import { EraYearFields, YearMonthBag, YearMonthFields, YearMonthFieldsIntl } from '../internal/calendarFields'
import { queryCalendarImpl } from '../internal/calendarImpl'
import { getCalendarIdFromBag, refineCalendarSlotString } from '../internal/calendarSlotString'
import { DateTimeDisplayOptions, DiffOptions, OverflowOptions } from '../internal/options'
import { NumSign } from '../internal/utils'
import { createYearMonthNewCalendarRecordIMPL, getDateModCalendarRecordIMPL, createYearMonthDiffCalendarRecordIMPL, createYearMonthModCalendarRecordIMPL, createYearMonthMoveCalendarRecordIMPL } from '../genericApi/recordCreators'
import { DurationSlots, PlainDateSlots, PlainYearMonthSlots } from '../genericApi/genericTypes'
import * as PlainYearMonthFuncs from '../genericApi/plainYearMonth'
import { DateTimeFormatSlots } from './dateTimeFormat'

export function create(
  isoYear: number,
  isoMonth: number,
  calendar?: string,
  referenceIsoDay?: number,
): PlainYearMonthSlots<string> {
  return PlainYearMonthFuncs.create(refineCalendarSlotString, isoYear, isoMonth, calendar, referenceIsoDay)
}

export function fromString(s: string): PlainYearMonthSlots<string> {
  return PlainYearMonthFuncs.fromString(s) // NOTE: just forwards
}

export function fromFields(
  bag: YearMonthBag & { calendar?: string },
  options?: OverflowOptions,
): PlainYearMonthSlots<string> {
  return PlainYearMonthFuncs.fromFields(
    createYearMonthNewCalendarRecordIMPL,
    getCalendarIdFromBag(bag),
    bag,
    options,
  )
}

export function getFields(slots: PlainYearMonthSlots<string>): YearMonthFields & Partial<EraYearFields> {
  const calendarImpl = queryCalendarImpl(slots.calendar)
  const [year, month] = calendarImpl.queryYearMonthDay(slots)

  return {
    era: calendarImpl.era(slots), // inefficient: requeries y/m/d
    eraYear: calendarImpl.eraYear(slots), // inefficient: requeries y/m/d
    year,
    month,
    monthCode: calendarImpl.monthCode(slots), // inefficient: requeries y/m/d
  }
}

export function withFields(
  plainYearMonthSlots: PlainYearMonthSlots<string>,
  initialFields: YearMonthFieldsIntl,
  mod: YearMonthBag,
  options?: OverflowOptions,
): PlainYearMonthSlots<string> {
  return PlainYearMonthFuncs.withFields(
    createYearMonthModCalendarRecordIMPL,
    plainYearMonthSlots,
    initialFields,
    mod,
    options,
  )
}

export function add(
  plainYearMonthSlots: PlainYearMonthSlots<string>,
  durationSlots: DurationSlots,
  options?: OverflowOptions,
): PlainYearMonthSlots<string> {
  return PlainYearMonthFuncs.add(
    createYearMonthMoveCalendarRecordIMPL,
    plainYearMonthSlots,
    durationSlots,
    options,
  )
}

export function subtract(
  plainYearMonthSlots: PlainYearMonthSlots<string>,
  durationSlots: DurationSlots,
  options?: OverflowOptions,
): PlainYearMonthSlots<string> {
  return PlainYearMonthFuncs.subtract(
    createYearMonthMoveCalendarRecordIMPL,
    plainYearMonthSlots,
    durationSlots,
    options,
  )
}

export function until(
  plainYearMonthSlots0: PlainYearMonthSlots<string>,
  plainYearMonthSlots1: PlainYearMonthSlots<string>,
  options?: DiffOptions,
): DurationSlots {
  return PlainYearMonthFuncs.until(
    createYearMonthDiffCalendarRecordIMPL,
    plainYearMonthSlots0,
    plainYearMonthSlots1,
    options,
  )
}

export function since(
  plainYearMonthSlots0: PlainYearMonthSlots<string>,
  plainYearMonthSlots1: PlainYearMonthSlots<string>,
  options?: DiffOptions,
): DurationSlots {
  return PlainYearMonthFuncs.since(
    createYearMonthDiffCalendarRecordIMPL,
    plainYearMonthSlots0,
    plainYearMonthSlots1,
    options,
  )
}

export function compare(
  plainYearMonthSlots0: PlainYearMonthSlots<string>,
  plainYearMonthSlots1: PlainYearMonthSlots<string>,
): NumSign {
  return PlainYearMonthFuncs.compare(plainYearMonthSlots0, plainYearMonthSlots1) // just forwards
}

export function equals(
  plainYearMonthSlots0: PlainYearMonthSlots<string>,
  plainYearMonthSlots1: PlainYearMonthSlots<string>,
): boolean {
  return PlainYearMonthFuncs.equals(plainYearMonthSlots0, plainYearMonthSlots1) // just forwards
}

export function toString(
  plainYearMonthSlots: PlainYearMonthSlots<string>,
  options?: DateTimeDisplayOptions,
): string {
  return PlainYearMonthFuncs.toString(plainYearMonthSlots, options) // just forwards
}

export function toJSON(
  plainYearMonthSlots: PlainYearMonthSlots<string>,
): string {
  return PlainYearMonthFuncs.toJSON(plainYearMonthSlots) // just forwards
}

export function toPlainDate<C>(
  plainYearMonthSlots: PlainYearMonthSlots<string>,
  plainYearMonthFields: YearMonthFieldsIntl,
  bag: { day: number },
): PlainDateSlots<string> {
  return PlainYearMonthFuncs.toPlainDate(
    getDateModCalendarRecordIMPL,
    plainYearMonthSlots,
    plainYearMonthFields,
    bag,
  )
}

// DateTimeFormat
// --------------

export function format(format: DateTimeFormatSlots, slots: PlainYearMonthSlots<string>): string {
  return '' // TODO
}

export function formatRange(
  format: DateTimeFormatSlots,
  slots0: PlainYearMonthSlots<string>,
  slots1: PlainYearMonthSlots<string>
): string {
  return '' // TODO
}
