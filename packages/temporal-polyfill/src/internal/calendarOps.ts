import { DurationFields } from './durationFields'
import { DateBag, YearMonthBag } from './fields'
import { IsoDateFields } from './isoFields'
import { DiffOptions, OverflowOptions } from './optionsRefine'
import {
  PlainDateSlots,
  PlainMonthDaySlots,
  PlainYearMonthSlots,
} from './slots'
import { DateUnitName, Unit } from './units'

// Operations for internal use!

// Function Types
// (Must always be called from a CalendarOps object)
export type DateFromFieldsOp<C> = (
  fields: DateBag,
  options?: OverflowOptions,
) => PlainDateSlots<C>

export type YearMonthFromFieldsOp<C> = (
  fields: YearMonthBag,
  options?: OverflowOptions,
) => PlainYearMonthSlots<C>

export type MonthDayFromFieldsOp<C> = (
  fields: DateBag,
  options?: OverflowOptions,
) => PlainMonthDaySlots<C>

export type FieldsOp = (fieldNames: string[]) => string[]

export type MergeFieldsOp = (
  fields: DateBag,
  additionalFields: DateBag,
) => DateBag

export type DateAddOp = (
  isoFields: IsoDateFields,
  durationFields: DurationFields,
  options?: OverflowOptions,
) => IsoDateFields

export type DateUntilOp = (
  isoFields0: IsoDateFields,
  isoFields1: IsoDateFields,
  largestUnit: Unit,
  origOptions?: DiffOptions<DateUnitName>,
) => DurationFields

export type DayOp = (isoFields: IsoDateFields) => number

// Refine
// (assumes received fields are ALREADY refined)
// TODO: have these functions return the branding too?

export type DateRefineOps<C> = {
  dateFromFields: DateFromFieldsOp<C>
  fields: FieldsOp
}
export type YearMonthRefineOps<C> = {
  yearMonthFromFields: YearMonthFromFieldsOp<C>
  fields: FieldsOp
}
export type MonthDayRefineOps<C> = {
  monthDayFromFields: MonthDayFromFieldsOp<C>
  fields: FieldsOp
}

// Mod
// (assumes received fields are ALREADY refined)
export type YearMonthModOps<C> = YearMonthRefineOps<C> & {
  mergeFields: MergeFieldsOp
}
export type DateModOps<C> = DateRefineOps<C> & { mergeFields: MergeFieldsOp }
export type MonthDayModOps<C> = MonthDayRefineOps<C> & {
  mergeFields: MergeFieldsOp
}

// Math

export type MoveOps = { dateAdd: DateAddOp }
export type DiffOps = { dateAdd: DateAddOp; dateUntil: DateUntilOp }

export type DayOps = { day: DayOp }

export type YearMonthMoveOps = MoveOps & DayOps
export type YearMonthDiffOps = DiffOps & DayOps
