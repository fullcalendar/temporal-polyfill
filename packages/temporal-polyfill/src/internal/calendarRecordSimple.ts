import { DateBagStrict, MonthDayBag, YearMonthBag } from './calendarFields'
import { CalendarImpl, queryCalendarImpl } from './calendarImpl'
import { DurationFieldsWithSign } from './durationFields'
import { IsoDateFields } from './isoFields'
import { LargestUnitOptions, OverflowOptions, refineOverflowOptions } from './options'
import { Unit } from './units'

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
  options?: OverflowOptions,
): IsoDateFields {
  return calendarImpl.dateAdd(
    isoDateFields,
    durationInternals,
    refineOverflowOptions(options),
  )
}

export function calendarImplDateUntil(
  calendarImpl: CalendarImpl,
  isoDateFields0: IsoDateFields,
  isoDateFields1: IsoDateFields,
  largestUnit: Unit,
  origOptions?: LargestUnitOptions,
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
  options?: OverflowOptions,
): IsoDateFields {
  return calendarImpl.dateFromFields(
    fields,
    refineOverflowOptions(options),
  )
}

export function calendarImplYearMonthFromFields(
  calendarImpl: CalendarImpl,
  fields: YearMonthBag,
  options?: OverflowOptions,
): IsoDateFields {
  return calendarImpl.yearMonthFromFields(
    fields,
    refineOverflowOptions(options),
  )
}

export function calendarImplMonthDayFromFields(
  calendarImpl: CalendarImpl,
  fields: MonthDayBag,
  options?: OverflowOptions,
): IsoDateFields {
  return calendarImpl.monthDayFromFields(
    fields,
    refineOverflowOptions(options),
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
