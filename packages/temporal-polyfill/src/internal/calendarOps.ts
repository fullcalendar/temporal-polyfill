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
export type DateFromFieldsOp = (
  fields: DateBag,
  options?: OverflowOptions,
  doingMerge?: boolean,
) => PlainDateSlots

export type YearMonthFromFieldsOp = (
  fields: YearMonthBag,
  options?: OverflowOptions,
  doingMerge?: boolean,
) => PlainYearMonthSlots

export type MonthDayFromFieldsOp = (
  fields: DateBag,
  options?: OverflowOptions,
) => PlainMonthDaySlots

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

export type DateRefineOps = {
  dateFromFields: DateFromFieldsOp
  fields: FieldsOp
}
export type YearMonthRefineOps = {
  yearMonthFromFields: YearMonthFromFieldsOp
  fields: FieldsOp
}
export type MonthDayRefineOps = {
  monthDayFromFields: MonthDayFromFieldsOp
  fields: FieldsOp
}

// Mod
// (assumes received fields are ALREADY refined)
export type YearMonthModOps = YearMonthRefineOps & {
  mergeFields: MergeFieldsOp
}
export type DateModOps = DateRefineOps & { mergeFields: MergeFieldsOp }
export type MonthDayModOps = MonthDayRefineOps & {
  mergeFields: MergeFieldsOp
}

// Math

export type MoveOps = { dateAdd: DateAddOp }
export type DiffOps = { dateAdd: DateAddOp; dateUntil: DateUntilOp }

export type DayOps = { day: DayOp }

export type YearMonthMoveOps = MoveOps & DayOps
export type YearMonthDiffOps = DiffOps & DayOps
