import { DateBagStrict, MonthDayBag, YearMonthBag } from '../internal/calendarFields'
import { CalendarImpl } from '../internal/calendarImpl'
import { queryCalendarImpl } from '../internal/calendarImplQuery'
import { DurationFieldsWithSign } from '../internal/durationFields'
import { IsoDateFields } from '../internal/isoFields'
import { Overflow } from '../internal/options'
import { Unit } from '../internal/units'

export function createCalendarImplRecord<
  ImplMethods extends Record<string, (this: CalendarImpl, ...any: any[]) => any>
>(
  calendarId: string,
  implMethods: ImplMethods,
): {
  [K in keyof ImplMethods]: ImplMethods[K] extends (this: CalendarImpl, ...args: infer Args) => infer Ret
    ? (...args: Args) => Ret
    : never
} {
  const calendarImpl = queryCalendarImpl(calendarId)
  const calendarRecord: any = {}

  for (const methodName in implMethods) {
    calendarRecord[methodName] = implMethods[methodName].bind(calendarImpl)
  }

  return calendarRecord
}

// Preconfigured Creators
// -------------------------------------------------------------------------------------------------

// date

export function createDateNewCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    dateFromFields: calendarImplDateFromFields,
    fields: calendarImplFields,
  })
}

export function getDateModCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    dateFromFields: calendarImplDateFromFields,
    fields: calendarImplFields,
    mergeFields: calendarImplMergeFields,
  })
}

export function getMoveCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    dateAdd: calendarImplDateAdd,
  })
}

export function getDiffCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    dateAdd: calendarImplDateAdd,
    dateUntil: calendarImplDateUntil,
  })
}

// year month

export function createYearMonthNewCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    yearMonthFromFields: calendarImplYearMonthFromFields,
    fields: calendarImplFields,
  })
}

export function createYearMonthModCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    yearMonthFromFields: calendarImplYearMonthFromFields,
    fields: calendarImplFields,
    mergeFields: calendarImplMergeFields,
  })
}

export function createYearMonthMoveCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    dateAdd: calendarImplDateAdd,
    daysInMonth: calendarImplDaysInMonth,
    day: calendarImplDay,
  })
}

export function createYearMonthDiffCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    dateAdd: calendarImplDateAdd,
    dateUntil: calendarImplDateUntil,
    day: calendarImplDay,
  })
}

// month day

export function createMonthDayNewCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    monthDayFromFields: calendarImplMonthDayFromFields,
    fields: calendarImplFields,
  })
}

export function createMonthDayModCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    monthDayFromFields: calendarImplMonthDayFromFields,
    fields: calendarImplFields,
    mergeFields: calendarImplMergeFields,
  })
}

// Individual CalendarImpl Methods
// -------------------------------------------------------------------------------------------------

export function calendarImplDateAdd(
  this: CalendarImpl,
  isoDateFields: IsoDateFields,
  durationInternals: DurationFieldsWithSign,
  overflow: Overflow,
): IsoDateFields {
  return this.dateAdd(
    isoDateFields,
    durationInternals,
    overflow,
  )
}

export function calendarImplDateUntil(
  this: CalendarImpl,
  isoDateFields0: IsoDateFields,
  isoDateFields1: IsoDateFields,
  largestUnit: Unit,
): DurationFieldsWithSign {
  return this.dateUntil(
    isoDateFields0,
    isoDateFields1,
    largestUnit,
  )
}

export function calendarImplDateFromFields(
  this: CalendarImpl,
  fields: DateBagStrict,
  overflow: Overflow,
): IsoDateFields {
  return this.dateFromFields(
    fields,
    overflow,
  )
}

export function calendarImplYearMonthFromFields(
  this: CalendarImpl,
  fields: YearMonthBag,
  overflow: Overflow,
): IsoDateFields {
  return this.yearMonthFromFields(
    fields,
    overflow,
  )
}

export function calendarImplMonthDayFromFields(
  this: CalendarImpl,
  fields: MonthDayBag,
  overflow: Overflow,
): IsoDateFields {
  return this.monthDayFromFields(
    fields,
    overflow,
  )
}

export function calendarImplFields(
  this: CalendarImpl,
  fieldNames: string[],
): string[] {
  return this.fields(fieldNames)
}

export function calendarImplMergeFields(
  this: CalendarImpl,
  fields0: Record<string, unknown>,
  fields1: Record<string, unknown>,
): Record<string, unknown> {
  return this.mergeFields(fields0, fields1)
}

export function calendarImplDay(
  this: CalendarImpl,
  isoDateFields: IsoDateFields,
): number {
  return this.day(isoDateFields)
}

export function calendarImplDaysInMonth(
  this: CalendarImpl,
  isoDateFields: IsoDateFields,
): number {
  return this.daysInMonth(isoDateFields)
}
