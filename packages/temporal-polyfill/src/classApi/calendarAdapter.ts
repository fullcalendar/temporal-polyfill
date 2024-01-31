import { requireObjectLike, requirePositiveInteger } from '../internal/cast'
import { DurationFields } from '../internal/durationFields'
import {
  DateBag,
  DateBagStrict,
  MonthDayBag,
  MonthDayBagStrict,
  YearMonthBag,
  YearMonthBagStrict,
} from '../internal/fields'
import { IsoDateFields } from '../internal/isoFields'
import { DiffOptions, OverflowOptions } from '../internal/optionsRefine'
import {
  DurationSlots,
  PlainDateSlots,
  PlainMonthDaySlots,
  PlainYearMonthSlots,
  createDurationSlots,
  createPlainDateSlots,
} from '../internal/slots'
import { Unit, unitNamesAsc } from '../internal/units'
import { Callable, bindArgs } from '../internal/utils'
import { CalendarProtocol, CalendarSlot } from './calendar'
import { createDuration, getDurationSlots } from './duration'
import { createPlainDate, getPlainDateSlots } from './plainDate'
import { getPlainMonthDaySlots } from './plainMonthDay'
import { getPlainYearMonthSlots } from './plainYearMonth'

// Compound Adapter Functions
// -----------------------------------------------------------------------------

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
  return requireObjectLike(
    mergeFields.call(
      calendarProtocol,
      Object.assign(Object.create(null), fields),
      Object.assign(Object.create(null), additionalFields),
    ),
  )
}

function dateFromFieldsAdapter(
  calendarProtocol: CalendarProtocol,
  dateFromFields: CalendarProtocol['dateFromFields'],
  fields: DateBag,
  options?: OverflowOptions,
): PlainDateSlots<CalendarSlot> {
  return getPlainDateSlots(
    dateFromFields.call(
      calendarProtocol,
      Object.assign(Object.create(null), fields) as DateBagStrict,
      options,
    ),
  )
}

function yearMonthFromFieldsAdapter(
  calendarProtocol: CalendarProtocol,
  yearMonthFromFields: CalendarProtocol['yearMonthFromFields'],
  fields: YearMonthBag,
  options?: OverflowOptions,
): PlainYearMonthSlots<CalendarSlot> {
  return getPlainYearMonthSlots(
    yearMonthFromFields.call(
      calendarProtocol,
      Object.assign(Object.create(null), fields) as YearMonthBagStrict,
      options,
    ),
  )
}

function monthDayFromFieldsAdapter(
  calendarProtocol: CalendarProtocol,
  monthDayFromFields: CalendarProtocol['monthDayFromFields'],
  fields: MonthDayBag,
  options?: OverflowOptions,
): PlainMonthDaySlots<CalendarSlot> {
  return getPlainMonthDaySlots(
    monthDayFromFields.call(
      calendarProtocol,
      Object.assign(Object.create(null), fields) as MonthDayBagStrict,
      options,
    ),
  )
}

function dateAddAdapter(
  calendarProtocol: CalendarProtocol,
  dateAdd: CalendarProtocol['dateAdd'],
  isoFields: IsoDateFields,
  durationFields: DurationFields,
  options?: OverflowOptions,
): PlainDateSlots<CalendarSlot> {
  return getPlainDateSlots(
    dateAdd.call(
      calendarProtocol,
      createPlainDate(createPlainDateSlots(isoFields, calendarProtocol)),
      createDuration(createDurationSlots(durationFields)),
      options,
    ),
  )
}

function dateUntilAdapter(
  calendarProtocol: CalendarProtocol,
  dateUntil: CalendarProtocol['dateUntil'],
  isoFields0: IsoDateFields,
  isoFields1: IsoDateFields,
  largestUnit: Unit,
  origOptions?: DiffOptions,
): DurationSlots {
  return getDurationSlots(
    dateUntil.call(
      calendarProtocol,
      createPlainDate(createPlainDateSlots(isoFields0, calendarProtocol)),
      createPlainDate(createPlainDateSlots(isoFields1, calendarProtocol)),
      Object.assign(Object.create(null), origOptions, {
        largestUnit: unitNamesAsc[largestUnit],
      }),
    ),
  )
}

function dayAdapter(
  calendarProtocol: CalendarProtocol,
  dayMethod: CalendarProtocol['day'],
  isoFields: IsoDateFields,
): number {
  return requirePositiveInteger(
    dayMethod.call(
      calendarProtocol,
      createPlainDate(createPlainDateSlots(isoFields, calendarProtocol)),
    ),
  )
}

// Compound Adapter Sets
// -----------------------------------------------------------------------------

const refineAdapters = { fields: fieldsAdapter }
export const dateRefineAdapters = {
  dateFromFields: dateFromFieldsAdapter,
  ...refineAdapters,
}
export const yearMonthRefineAdapters = {
  yearMonthFromFields: yearMonthFromFieldsAdapter,
  ...refineAdapters,
}
export const monthDayRefineAdapters = {
  monthDayFromFields: monthDayFromFieldsAdapter,
  ...refineAdapters,
}

const modAdapters = { mergeFields: mergeFieldsAdapter }
export const dateModAdapters = { ...dateRefineAdapters, ...modAdapters }
export const yearMonthModAdapters = {
  ...yearMonthRefineAdapters,
  ...modAdapters,
}
export const monthDayModAdapters = { ...monthDayRefineAdapters, ...modAdapters }

export const moveAdapters = { dateAdd: dateAddAdapter }
export const diffAdapters = { ...moveAdapters, dateUntil: dateUntilAdapter }
export const yearMonthMoveAdapters = { ...moveAdapters, day: dayAdapter }
export const yearMonthDiffAdapters = { ...diffAdapters, day: dayAdapter }

// Compound Adapter Instantiation
// -----------------------------------------------------------------------------

export type AdapterCompoundOps<KV> = {
  [K in keyof KV]: KV[K] extends (
    c: CalendarProtocol,
    m: Callable,
    ...args: infer Args
  ) => infer Return
    ? (...args: Args) => Return
    : never
}

export function createAdapterCompoundOps<KV extends {}>(
  calendarProtocol: CalendarProtocol,
  adapterFuncs: KV,
): AdapterCompoundOps<KV> {
  const keys = Object.keys(adapterFuncs).sort()
  const boundFuncs = {} as any

  for (const key of keys) {
    boundFuncs[key] = bindArgs(
      (adapterFuncs as any)[key],
      calendarProtocol,
      (calendarProtocol as any)[key],
    )
  }

  return boundFuncs
}
