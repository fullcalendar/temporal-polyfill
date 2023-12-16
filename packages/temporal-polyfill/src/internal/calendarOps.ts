import { DateBag, YearMonthBag } from './calendarFields'
import { DurationFields } from './durationFields'
import { IsoDateFields } from './calendarIsoFields'
import { Overflow } from './options'
import { Unit } from './units'

// Function Types
// (Must always be called from a CalendarOps object)
export type DateFromFieldsOp = (fields: DateBag, overflow: Overflow) => IsoDateFields
export type YearMonthFromFieldsOp = (fields: YearMonthBag, overflow: Overflow) => IsoDateFields
export type MonthDayFromFieldsOp = (fields: DateBag, overflow: Overflow) => IsoDateFields
export type FieldsOp = (fieldNames: string[]) => string[]
export type MergeFieldsOp = (fields: DateBag, additionalFields: DateBag) => DateBag
export type DateAddOp = (isoFields: IsoDateFields, durationFields: DurationFields, overflow: Overflow) => IsoDateFields
export type DateUntilOp = (isoFields0: IsoDateFields, isoFields1: IsoDateFields, largestUnit: Unit) => DurationFields
export type DayOp = (isoFields: IsoDateFields) => number

// Refine
export type DateRefineOps = { dateFromFields: DateFromFieldsOp, fields: FieldsOp }
export type YearMonthRefineOps = { yearMonthFromFields: YearMonthFromFieldsOp, fields: FieldsOp }
export type MonthDayRefineOps = { monthDayFromFields: MonthDayFromFieldsOp, fields: FieldsOp }

// Mod
export type YearMonthModOps = YearMonthRefineOps & { mergeFields: MergeFieldsOp }
export type DateModOps = DateRefineOps & { mergeFields: MergeFieldsOp }
export type MonthDayModOps = MonthDayRefineOps & { mergeFields: MergeFieldsOp }

// Math
export type MoveOps = { dateAdd: DateAddOp }
export type DiffOps = { dateAdd: DateAddOp, dateUntil: DateUntilOp }
export type YearMonthMoveOps = MoveOps & { day: DayOp }
export type YearMonthDiffOps = DiffOps & { day: DayOp }
