import { DurationBranding, PlainDateBranding } from '../genericApi/branding'
import { overflowMapNames } from '../genericApi/options'
import { DateBag, DateBagStrict, MonthDayBag, MonthDayBagStrict, YearMonthBag, YearMonthBagStrict } from '../internal/calendarFields'
import { ensureBoolean, ensureInteger, ensureIntegerOrUndefined, ensureObjectlike, ensurePositiveInteger, ensureString, ensureStringOrUndefined } from '../internal/cast'
import { DurationFields, DurationFieldsWithSign } from '../internal/durationFields'
import { IsoDateFields } from '../internal/isoFields'
import { Overflow } from '../internal/options'
import { Unit, unitNamesAsc } from '../internal/units'
import { Callable, mapProps } from '../internal/utils'
import { CalendarProtocol } from './calendar'
import { createDuration, getDurationSlots } from './duration'
import { createPlainDate, getPlainDateSlots } from './plainDate'
import { getPlainMonthDaySlots } from './plainMonthDay'
import { getPlainYearMonthSlots } from './plainYearMonth'

// Refiner Config
// -------------------------------------------------------------------------------------------------

export const dateOnlyRefiners = {
  dayOfWeek: ensurePositiveInteger,
  dayOfYear: ensurePositiveInteger,
  weekOfYear: ensurePositiveInteger,
  yearOfWeek: ensureInteger, // can be negative
  daysInWeek: ensurePositiveInteger,
}

export const yearMonthOnlyRefiners = {
  era: ensureStringOrUndefined,
  eraYear: ensureIntegerOrUndefined,
  year: ensureInteger,
  month: ensurePositiveInteger,
  daysInMonth: ensurePositiveInteger,
  daysInYear: ensurePositiveInteger,
  inLeapYear: ensureBoolean,
  monthsInYear: ensurePositiveInteger,
}

export const monthOnlyRefiners = {
  monthCode: ensureString,
}

export const dayOnlyRefiners = {
  day: ensurePositiveInteger,
}

export const dateRefiners = {
  ...dateOnlyRefiners,
  ...yearMonthOnlyRefiners,
  ...monthOnlyRefiners,
  ...dayOnlyRefiners,
}

// Compound Adapter Functions
// -------------------------------------------------------------------------------------------------

function dateAddAdapter(
  calendarProtocol: CalendarProtocol,
  dateAdd: CalendarProtocol['dateAdd'],
  isoFields: IsoDateFields,
  durationFields: DurationFields,
  overflow: Overflow,
) {
  return getPlainDateSlots(
    dateAdd.call(
      calendarProtocol,
      createPlainDate({
        ...isoFields,
        calendar: calendarProtocol,
        branding: PlainDateBranding, // go at to override what isoDateFields might provide!
      }),
      createDuration({
        ...(durationFields as DurationFieldsWithSign), // !!!
        branding: DurationBranding,
      }),
      Object.assign(Object.create(null), { overflow: overflowMapNames[overflow] })
    )
  )
}

function dateUntilAdapter(
  calendarProtocol: CalendarProtocol,
  dateUntil: CalendarProtocol['dateUntil'],
  isoFields0: IsoDateFields,
  isoFields1: IsoDateFields,
  largestUnit: Unit,
) {
  return getDurationSlots(
    dateUntil.call(
      calendarProtocol,
      createPlainDate({
        ...isoFields0,
        calendar: calendarProtocol,
        branding: PlainDateBranding,
      }),
      createPlainDate({
        ...isoFields1,
        calendar: calendarProtocol,
        branding: PlainDateBranding,
      }),
      Object.assign(Object.create(null), { largestUnit: unitNamesAsc[largestUnit] })
    ),
  )
}

function dateFromFieldsAdapter(
  calendarProtocol: CalendarProtocol,
  dateFromFields: CalendarProtocol['dateFromFields'],
  fields: DateBag,
  overflow: Overflow,
) {
  return getPlainDateSlots(
    dateFromFields.call(
      calendarProtocol,
      Object.assign(Object.create(null), fields) as DateBagStrict,
      Object.assign(Object.create(null), { overflow: overflowMapNames[overflow] })
    )
  )
}

function yearMonthFromFieldsAdapter(
  calendarProtocol: CalendarProtocol,
  yearMonthFromFields: CalendarProtocol['yearMonthFromFields'],
  fields: YearMonthBag,
  overflow: Overflow,
) {
  return getPlainYearMonthSlots(
    yearMonthFromFields.call(
      calendarProtocol,
      Object.assign(Object.create(null), fields) as YearMonthBagStrict,
      Object.assign(Object.create(null), { overflow: overflowMapNames[overflow] })
    )
  )
}

function monthDayFromFieldsAdapter(
  calendarProtocol: CalendarProtocol,
  monthDayFromFields: CalendarProtocol['monthDayFromFields'],
  fields: MonthDayBag,
  overflow: Overflow,
) {
  return getPlainMonthDaySlots(
    monthDayFromFields.call(
      calendarProtocol,
      Object.assign(Object.create(null), fields) as MonthDayBagStrict,
      Object.assign(Object.create(null), { overflow: overflowMapNames[overflow] })
    )
  )
}

function fieldsAdapter(
  calendarProtocol: CalendarProtocol,
  fieldsMethod: CalendarProtocol['fields'],
  fieldNames: Iterable<string>,
): string[] {
  return [...fieldsMethod.call(calendarProtocol, fieldNames)]
}

function mergeFieldsAdapter(
  calendarProtocol: CalendarProtocol,
  mergeFields: CalendarProtocol['mergeFields'],
  fields: any,
  additionalFields: any,
) {
  return ensureObjectlike(
    mergeFields.call(
      calendarProtocol,
      Object.assign(Object.create(null), fields),
      Object.assign(Object.create(null), additionalFields),
    ),
  )
}

// Compound Adapter Sets
// -------------------------------------------------------------------------------------------------

export const moveAdapters = { dateAdd: dateAddAdapter }
export const diffAdapters = { ...moveAdapters, dateUntil: dateUntilAdapter }

const refineAdapters = { fields: fieldsAdapter }
export const dateRefineAdapters = { dateFromFields: dateFromFieldsAdapter, ...refineAdapters }
export const yearMonthRefineAdapters = { yearMonthFromFields: yearMonthFromFieldsAdapter, ...refineAdapters }
export const monthDayRefineAdapters = { monthDayFromFields: monthDayFromFieldsAdapter, ...refineAdapters }

const modAdapters = { mergeFields: mergeFieldsAdapter }
export const dateModAdapters = { ...dateRefineAdapters, ...modAdapters }
export const yearMonthModAdapters = { ...yearMonthRefineAdapters, ...modAdapters }
export const monthDayModAdapters = { ...monthDayRefineAdapters, ...modAdapters }

// Compound Adapter Instantiation
// -------------------------------------------------------------------------------------------------

type ComplexAdapterMethods<KV> = {
  [K in keyof KV]:
    KV[K] extends (c: CalendarProtocol, m: Callable, ...args: infer Args) => infer Return
      ? (...args: Args) => Return
      : never
}

export function createCompoundAdapterOps<KV extends {}>(
  calendarProtocol: CalendarProtocol,
  adapterFuncs: KV,
): ComplexAdapterMethods<KV> {
  const keys = Object.keys(adapterFuncs).sort()
  const boundFuncs = {} as any

  // TODO: use mapProps?
  for (const key of keys) {
    boundFuncs[key] = (adapterFuncs as any)[key].bind(
      undefined,
      calendarProtocol,
      (calendarProtocol as any)[key],
    )
  }

  return boundFuncs
}

// Simple Adapter-Instantiation (always accepts PlainDate, simply refines result)
// -------------------------------------------------------------------------------------------------

interface AdapterSimpleState {
  calendarProtocol: CalendarProtocol
}

const adapterSimpleOps = mapProps(
  (refiner, methodName) => {
    return function(this: AdapterSimpleState, isoFields: IsoDateFields) {
      const { calendarProtocol } = this
      return refiner(
        (calendarProtocol as any)[methodName](
          createPlainDate({
            ...isoFields,
            calendar: calendarProtocol,
            branding: PlainDateBranding,
          })
        )
      )
    }
  },
  dateRefiners as Record<string, Callable>,
)

export function createAdapterSimpleOps(calendarProtocol: CalendarProtocol) {
  return Object.assign(
    Object.create(adapterSimpleOps),
    { calendarProtocol } as AdapterSimpleState,
  )
}
