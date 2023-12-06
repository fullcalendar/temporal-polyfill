import { DateBagStrict, MonthDayBag, YearMonthBag } from '../internal/calendarFields'
import { CalendarImpl } from '../internal/calendarImpl'
import { queryCalendarImpl } from '../internal/calendarImplQuery'
import { DurationFieldsWithSign } from '../internal/durationFields'
import { IsoDateFields } from '../internal/isoFields'
import { Overflow } from '../internal/options'
import { Unit } from '../internal/units'

// TODO: move to 'internal'

// CalendarImpl Record Creation
// -------------------------------------------------------------------------------------------------
// TODO: more DRY

export type CalendarImplFunc = (calendarImpl: CalendarImpl, ...args: any[]) => any

export type CalendarImplMethod<Func> =
  Func extends (calendarImpl: CalendarImpl, ...args: infer Args) => infer Ret
    ? (...args: Args) => Ret
    : never

export function createCalendarImplRecord<
  CalendarImplFuncs extends Record<string, CalendarImplFunc>
>(
  calendarId: string,
  funcs: CalendarImplFuncs = {} as any,
): {
  [K in keyof CalendarImplFuncs]: CalendarImplMethod<CalendarImplFuncs[K]>
} {
  const calendarImpl = queryCalendarImpl(calendarId)
  const calendarRecord: any = {}

  // TODO: get rid of this
  for (const methodName in funcs) {
    calendarRecord[methodName] = funcs[methodName].bind(undefined, calendarImpl)
  }

  return calendarRecord
}

// CalendarImpl Functions
// -------------------------------------------------------------------------------------------------

export function calendarImplDateAdd(
  calendarImpl: CalendarImpl,
  isoDateFields: IsoDateFields,
  durationInternals: DurationFieldsWithSign,
  overflow: Overflow,
): IsoDateFields {
  return calendarImpl.dateAdd(
    isoDateFields,
    durationInternals,
    overflow,
  )
}

export function calendarImplDateUntil(
  calendarImpl: CalendarImpl,
  isoDateFields0: IsoDateFields,
  isoDateFields1: IsoDateFields,
  largestUnit: Unit,
): DurationFieldsWithSign {
  return calendarImpl.dateUntil(
    isoDateFields0,
    isoDateFields1,
    largestUnit,
  )
}

export function calendarImplDateFromFields(
  calendarImpl: CalendarImpl,
  fields: DateBagStrict,
  overflow: Overflow,
): IsoDateFields {
  return calendarImpl.dateFromFields(
    fields,
    overflow,
  )
}

export function calendarImplYearMonthFromFields(
  calendarImpl: CalendarImpl,
  fields: YearMonthBag,
  overflow: Overflow,
): IsoDateFields {
  return calendarImpl.yearMonthFromFields(
    fields,
    overflow,
  )
}

export function calendarImplMonthDayFromFields(
  calendarImpl: CalendarImpl,
  fields: MonthDayBag,
  overflow: Overflow,
): IsoDateFields {
  return calendarImpl.monthDayFromFields(
    fields,
    overflow,
  )
}

export function calendarImplFields(
  calendarImpl: CalendarImpl,
  fieldNames: string[],
): string[] {
  return calendarImpl.fields(fieldNames)
}

export function calendarImplMergeFields(
  calendarImpl: CalendarImpl,
  fields0: Record<string, unknown>,
  fields1: Record<string, unknown>,
): Record<string, unknown> {
  return calendarImpl.mergeFields(fields0, fields1)
}

export function calendarImplDay(
  calendarImpl: CalendarImpl,
  isoDateFields: IsoDateFields,
): number {
  return calendarImpl.day(isoDateFields)
}


export function calendarImplDaysInMonth(
  calendarImpl: CalendarImpl,
  isoDateFields: IsoDateFields,
): number {
  return calendarImpl.daysInMonth(isoDateFields)
}
