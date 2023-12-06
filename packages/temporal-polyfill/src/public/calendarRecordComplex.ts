import { DateBagStrict, MonthDayBag, MonthDayBagStrict, YearMonthBag, YearMonthBagStrict } from '../internal/calendarFields'
import { CalendarImpl } from '../internal/calendarImpl'
import { ensureObjectlike, ensurePositiveInteger } from '../internal/cast'
import { DurationFieldsWithSign } from '../internal/durationFields'
import { IsoDateFields } from '../internal/isoFields'
import { overflowMapNames } from '../internal/options'
import { Unit, unitNamesAsc } from '../internal/units'
import { Overflow } from '../internal/optionEnums'
import { CalendarImplFunc, CalendarImplMethod, createCalendarImplRecord } from '../genericApi/calendarRecordSimple'
import { DurationBranding, PlainDateBranding } from '../genericApi/branding'

// public
import { CalendarSlot } from './calendarSlot'
import { IsoDateSlots } from './slots'
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
  implFuncs: CalendarImplFuncs = {} as any,
  protocolFuncs: {
    [K in keyof CalendarImplFuncs]: CalendarProtocolFuncViaImpl<CalendarImplFuncs[K]>
  } = {} as any,
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
): {
  [FuncName in keyof Funcs]: CalendarProtocolMethod<Funcs[FuncName]>
} {
  const calendarRecord: any = {}

  for (const methodName in funcs) {
    calendarRecord[methodName] = funcs[methodName].bind(undefined, calendarProtocol)
  }

  return calendarRecord
}

// CalendarProtocol Functions
// -------------------------------------------------------------------------------------------------

export function calendarProtocolDateAdd(
  calendarProtocol: CalendarProtocol,
  isoDateFields: IsoDateFields,
  durationInternals: DurationFieldsWithSign,
  overflow: Overflow,
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
      Object.assign(
        Object.create(null),
        { overflow: overflowMapNames[overflow] },
      )
    )
  )
}

export function calendarProtocolDateUntil(
  calendarProtocol: CalendarProtocol,
  isoDateFields0: IsoDateFields,
  isoDateFields1: IsoDateFields,
  largestUnit: Unit,
): DurationFieldsWithSign {
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
        { largestUnit: unitNamesAsc[largestUnit] },
      )
    ),
  )
}

export function calendarProtocolDateFromFields(
  calendarProtocol: CalendarProtocol,
  fields: DateBagStrict,
  overflow: Overflow,
): IsoDateSlots { // YUCK
  return getPlainDateSlots(
    calendarProtocol.dateFromFields(
      // TODO: make util
      // only necessary if fabricating internally
      Object.assign(Object.create(null), fields) as DateBagStrict,
      Object.assign(
        Object.create(null),
        { overflow: overflowMapNames[overflow] },
      )
    )
  )
}

export function calendarProtocolYearMonthFromFields(
  calendarProtocol: CalendarProtocol,
  fields: YearMonthBag,
  overflow: Overflow,
): IsoDateSlots {
  return getPlainYearMonthSlots(
    calendarProtocol.yearMonthFromFields(
      // TODO: make util
      // only necessary if fabricating internally
      Object.assign(Object.create(null), fields) as YearMonthBagStrict,
      Object.assign(
        Object.create(null),
        { overflow: overflowMapNames[overflow] },
      )
    )
  )
}

export function calendarProtocolMonthDayFromFields(
  calendarProtocol: CalendarProtocol,
  fields: MonthDayBag,
  overflow: Overflow,
): IsoDateSlots {
  return getPlainMonthDaySlots(
    calendarProtocol.monthDayFromFields(
      // TODO: make util
      // only necessary if fabricating internally
      Object.assign(Object.create(null), fields) as MonthDayBagStrict,
      Object.assign(
        Object.create(null),
        { overflow: overflowMapNames[overflow] },
      )
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
