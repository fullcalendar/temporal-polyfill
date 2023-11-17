import { DateBagStrict, MonthDayBag, MonthDayBagStrict, YearMonthBag, YearMonthBagStrict } from '../internal/calendarFields'
import { CalendarImpl } from '../internal/calendarImpl'
import { CalendarImplFunc, CalendarImplMethod, createCalendarImplRecord } from '../internal/calendarRecordSimple'
import { CalendarSlot } from '../internal/calendarSlot'
import { ensureObjectlike, ensurePositiveInteger } from '../internal/cast'
import { DurationInternals } from '../internal/durationFields'
import { IsoDateFields } from '../internal/isoFields'
import { LargestUnitOptions, OverflowOptions } from '../internal/options'
import { DurationBranding, IsoDateSlots, PlainDateBranding } from '../internal/slots'
import { Unit, unitNamesAsc } from '../internal/units'

// public
import { CalendarProtocol } from './calendar'
import { createDuration, getDurationSlots } from './duration'
import { createPlainDate, getPlainDateSlots } from './plainDate'
import { getPlainMonthDaySlots } from './plainMonthDay'
import { getPlainYearMonthSlots } from './plainYearMonth'

// CONDITIONAL Record Creation
// -------------------------------------------------------------------------------------------------
// TODO: more DRY

export type CalendarProtocolFuncViaImpl<ImplFunc> =
  ImplFunc extends (calendarImpl: CalendarImpl, ...args: infer Args) => infer Ret
    ? (calendarProtocol: CalendarProtocol, ...args: Args) => Ret
    : never

export function createCalendarSlotRecord<
  CalendarImplFuncs extends Record<string, CalendarImplFunc>
>(
  calendarSlot: CalendarSlot,
  implFuncs: CalendarImplFuncs,
  protocolFuncs: {
    [K in keyof CalendarImplFuncs]: CalendarProtocolFuncViaImpl<CalendarImplFuncs[K]>
  },
): {
  [K in keyof CalendarImplFuncs]: CalendarImplMethod<CalendarImplFuncs[K]>
} {
  if (typeof calendarSlot === 'string') {
    return createCalendarImplRecord(calendarSlot, implFuncs)
  }
  return createCalendarProtocolRecord(calendarSlot, protocolFuncs) as any
}

// CalendarProtocol Record Creation
// -------------------------------------------------------------------------------------------------
// TODO: more DRY

type CalendarProtocolFunc = (calendarProtocol: CalendarProtocol, ...args: any[]) => any

type CalendarProtocolMethod<Func> =
  Func extends (calendarProtocol: CalendarProtocol, ...args: infer Args) => infer Ret
    ? (...args: Args) => Ret
    : never

function createCalendarProtocolRecord<Funcs extends { [funcName: string]: CalendarProtocolFunc }>(
  calendarProtocol: CalendarProtocol,
  funcs: Funcs,
): { [FuncName in keyof Funcs]: CalendarProtocolMethod<Funcs[FuncName]> } {
  const calendarRecord: any = {}

  for (const methodName in funcs) {
    calendarRecord[methodName] = funcs[methodName].bind(calendarProtocol)
  }

  return calendarRecord
}

// CalendarProtocol Functions
// -------------------------------------------------------------------------------------------------

export function calendarProtocolDateAdd(
  calendarProtocol: CalendarProtocol,
  isoDateFields: IsoDateFields,
  durationInternals: DurationInternals,
  options?: OverflowOptions,
): IsoDateFields {
  return getPlainDateSlots(
    calendarProtocol.dateAdd(
      createPlainDate({
        ...isoDateFields,
        calendar: calendarProtocol,
        branding: PlainDateBranding, // go at to override what isoDateFields might provide!
      }),
      createDuration({
        ...durationInternals,
        branding: DurationBranding,
      }),
      options,
    )
  )
}

export function calendarProtocolDateUntil(
  calendarProtocol: CalendarProtocol,
  isoDateFields0: IsoDateFields,
  isoDateFields1: IsoDateFields,
  largestUnit: Unit,
  origOptions?: LargestUnitOptions,
): DurationInternals {
  return getDurationSlots(
    calendarProtocol.dateUntil(
      createPlainDate({
        ...isoDateFields0,
        calendar: calendarProtocol,
        branding: PlainDateBranding,
      }),
      createPlainDate({
        ...isoDateFields1,
        calendar: calendarProtocol,
        branding: PlainDateBranding,
      }),
      Object.assign(
        Object.create(null),
        { ...origOptions, largestUnit: unitNamesAsc[largestUnit] },
      )
    ),
  )
}

export function calendarProtocolDateFromFields(
  calendarProtocol: CalendarProtocol,
  fields: DateBagStrict,
  options?: OverflowOptions,
): IsoDateSlots { // YUCK
  return getPlainDateSlots(
    calendarProtocol.dateFromFields(
      // TODO: make util
      // only necessary if fabricating internally
      Object.assign(Object.create(null), fields) as DateBagStrict,
      options,
    )
  )
}

export function calendarProtocolYearMonthFromFields(
  calendarProtocol: CalendarProtocol,
  fields: YearMonthBag,
  options?: OverflowOptions,
): IsoDateSlots {
  return getPlainYearMonthSlots(
    calendarProtocol.yearMonthFromFields(
      // TODO: make util
      // only necessary if fabricating internally
      Object.assign(Object.create(null), fields) as YearMonthBagStrict,
      options,
    )
  )
}

export function calendarProtocolMonthDayFromFields(
  calendarProtocol: CalendarProtocol,
  fields: MonthDayBag,
  options?: OverflowOptions,
): IsoDateSlots {
  return getPlainMonthDaySlots(
    calendarProtocol.monthDayFromFields(
      // TODO: make util
      // only necessary if fabricating internally
      Object.assign(Object.create(null), fields) as MonthDayBagStrict,
      options,
    )
  )
}

export function calendarProtocolFields(
  calendarProtocol: CalendarProtocol,
  fieldNames: string[],
): string[] {
  return [...calendarProtocol.fields(fieldNames)]
}

export function calendarProtocolMergeFields(
  calendarProtocol: CalendarProtocol,
  fields0: Record<string, unknown>,
  fields1: Record<string, unknown>,
): Record<string, unknown> {
  return ensureObjectlike(
    calendarProtocol.mergeFields(
      Object.assign(Object.create(null), fields0),
      Object.assign(Object.create(null), fields1),
    ),
  )
}

export function calendarProtocolDay(
  calendarProtocol: CalendarProtocol,
  isoDateFields: IsoDateFields,
): number {
  return ensurePositiveInteger(
    calendarProtocol.day(
      createPlainDate({
        ...isoDateFields,
        calendar: calendarProtocol,
        branding: PlainDateBranding,
      })
    )
  )
}

export function calendarProtocolDaysInMonth(
  calendarProtocol: CalendarProtocol,
  isoDateFields: IsoDateFields,
): number {
  return ensurePositiveInteger(
    calendarProtocol.daysInMonth(
      createPlainDate({
        ...isoDateFields,
        calendar: calendarProtocol,
        branding: PlainDateBranding,
      })
    )
  )
}
