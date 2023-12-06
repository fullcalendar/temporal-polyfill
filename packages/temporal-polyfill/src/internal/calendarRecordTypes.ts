import { DateBagStrict, MonthDayBag, YearMonthBag } from './calendarFields'
import { DurationFieldsWithSign } from './durationFields'
import { IsoDateFields } from './isoFields'
import { OverflowOptions } from './options'
import { Unit } from './units'

export type CalendarDateAddFunc = (
  isoDateFields: IsoDateFields,
  durationInternals: DurationFieldsWithSign,
  options?: OverflowOptions,
) => IsoDateFields

export type CalendarDateUntilFunc = (
  isoDateFields0: IsoDateFields,
  isoDateFields1: IsoDateFields,
  largestUnit: Unit,
) => DurationFieldsWithSign

export type CalendarDateFromFieldsFunc = (
  fields: DateBagStrict,
  options?: OverflowOptions,
) => IsoDateFields

export type CalendarYearMonthFromFieldsFunc = (
  fields: YearMonthBag,
  options?: OverflowOptions,
) => IsoDateFields

export type CalendarMonthDayFromFieldsFunc = (
  fields: MonthDayBag,
  options?: OverflowOptions,
) => IsoDateFields

export type CalendarFieldsFunc = (
  fieldNames: string[],
) => string[]

export type CalendarMergeFieldsFunc = (
  fields0: Record<string, unknown>,
  fields1: Record<string, unknown>,
) => Record<string, unknown>

export type CalendarDayFunc = (
  isoDateFields: IsoDateFields,
) => number

export type CalendarDaysInMonthFunc = (
  isoDateFields: IsoDateFields,
) => number
