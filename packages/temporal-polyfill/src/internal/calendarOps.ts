import { DateBag, YearMonthBag } from './calendarFields'
import { DurationFields } from './durationFields'
import { IsoDateFields } from './calendarIsoFields'
import { Unit } from './units'
import { OverflowOptions } from '../genericApi/optionsRefine'

// Operations for internal use!

// Function Types
// (Must always be called from a CalendarOps object)
export type DateFromFieldsOp<C> = (fields: DateBag, options?: OverflowOptions) => IsoDateFields & { calendar: C }
export type YearMonthFromFieldsOp<C> = (fields: YearMonthBag, options?: OverflowOptions) => IsoDateFields & { calendar: C }
export type MonthDayFromFieldsOp<C> = (fields: DateBag, options?: OverflowOptions) => IsoDateFields & { calendar: C }
export type FieldsOp = (fieldNames: string[]) => string[]
export type MergeFieldsOp = (fields: DateBag, additionalFields: DateBag) => DateBag
export type DateAddOp = (isoFields: IsoDateFields, durationFields: DurationFields, options?: OverflowOptions) => IsoDateFields
export type DateUntilOp = (isoFields0: IsoDateFields, isoFields1: IsoDateFields, largestUnit: Unit) => DurationFields
export type DayOp = (isoFields: IsoDateFields) => number

// Refine
// (assumes received fields are ALREADY refined)
export type DateRefineOps<C> = { dateFromFields: DateFromFieldsOp<C>, fields: FieldsOp }
export type YearMonthRefineOps<C> = { yearMonthFromFields: YearMonthFromFieldsOp<C>, fields: FieldsOp }
export type MonthDayRefineOps<C> = { monthDayFromFields: MonthDayFromFieldsOp<C>, fields: FieldsOp }

// Mod
// (assumes received fields are ALREADY refined)
export type YearMonthModOps<C> = YearMonthRefineOps<C> & { mergeFields: MergeFieldsOp }
export type DateModOps<C> = DateRefineOps<C> & { mergeFields: MergeFieldsOp }
export type MonthDayModOps<C> = MonthDayRefineOps<C> & { mergeFields: MergeFieldsOp }

// Math
export type MoveOps = { dateAdd: DateAddOp }
export type DiffOps = { dateAdd: DateAddOp, dateUntil: DateUntilOp }
export type YearMonthMoveOps = MoveOps & { day: DayOp }
export type YearMonthDiffOps = DiffOps & { day: DayOp }
