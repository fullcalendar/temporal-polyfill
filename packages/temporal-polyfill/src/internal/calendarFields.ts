import { mapPropNamesToConstant } from './utils'
import { DurationFields } from './durationFields'
import { Unit, unitNamesAsc } from './units'

// Year/Month/Day (no era/eraYear)
// -------------------------------------------------------------------------------------------------

export interface YearFields {
  year: number
}

export interface MonthFields {
  monthCode: string
  month: number
}

export interface DayFields {
  day: number
}

export type YearMonthFields = YearFields & MonthFields
export type DateFields = YearMonthFields & DayFields
export type MonthDayFields = MonthFields & DayFields

// Fields with era/eraYear
// -------------------------------------------------------------------------------------------------

export interface EraYearFields {
  era: string
  eraYear: number
}

export type YearFieldsIntl = EraYearFields & YearFields
export type YearMonthFieldsIntl = EraYearFields & YearMonthFields
export type DateFieldsIntl = EraYearFields & DateFields
export type MonthDayFieldsIntl = MonthDayFields // this is stupid

// Simple Bag (all props optional)
// -------------------------------------------------------------------------------------------------
// TODO: move to bag.ts?

export type YearMonthBag = Partial<YearMonthFieldsIntl>
export type DateBag = Partial<DateFieldsIntl>
export type MonthDayBag = Partial<MonthDayFieldsIntl>
export type DurationBag = Partial<DurationFields>

// Strict Bag (with complex expressions)
// -------------------------------------------------------------------------------------------------

export type EraYearOrYear = EraYearFields | YearFields
export type MonthCodeOrMonthAndYear = { monthCode: string } | ({ month: number } & EraYearOrYear)
export type MonthCodeOrMonth = { monthCode: string } | { month: number }

export type YearMonthBagStrict = EraYearOrYear & MonthCodeOrMonth
export type DateBagStrict = EraYearOrYear & MonthCodeOrMonth & DayFields
export type MonthDayBagStrict = MonthCodeOrMonthAndYear & DayFields

// -------------------------------------------------------------------------------------------------

export interface TimeFields {
  hour: number
  microsecond: number
  millisecond: number
  minute: number
  nanosecond: number
  second: number
}

export type TimeBag = Partial<TimeFields>
export type DateTimeBag = DateBag & TimeBag // TODO: use for PlainDateTime?
export type DateTimeFields = DateFields & TimeFields

export interface DateBasics {
  year: number
  month: number
  day: number
}

export interface YearStats {
  daysInYear: number
  inLeapYear: boolean
  monthsInYear: number
}

export interface YearMonthStats extends YearStats {
  daysInMonth: number
}

export interface DateStats extends YearMonthStats {
  dayOfWeek: number
  dayOfYear: number
  weekOfYear: number
  yearOfWeek: number
  daysInWeek: number
}

// Field Names
// -------------------------------------------------------------------------------------------------

export const timeFieldNamesAsc = unitNamesAsc.slice(0, Unit.Day) as (keyof TimeFields)[]
export const timeFieldNamesAlpha = timeFieldNamesAsc.slice().sort()

export const offsetFieldNames = ['offset']
export const timeZoneFieldNames = ['timeZone']

export const timeAndOffsetFieldNames = [...timeFieldNamesAsc, ...offsetFieldNames]
export const timeAndZoneFieldNames = [...timeAndOffsetFieldNames, ...timeZoneFieldNames]

// pre-sorted!!!...

export const eraYearFieldNames = ['era', 'eraYear']
export const allYearFieldNames = [...eraYearFieldNames, 'year']

export const yearFieldNames = ['year']
export const monthCodeFieldNames = ['monthCode']
export const monthFieldNames = ['month', ...monthCodeFieldNames] // month/monthCode
export const dayFieldNames = ['day']

export const yearMonthFieldNames = [...monthFieldNames, ...yearFieldNames] // month/monthCode/year
export const yearMonthCodeFieldNames = [...monthCodeFieldNames, ...yearFieldNames] // monthCode/year

export const dateFieldNamesAlpha = [...dayFieldNames, ...yearMonthFieldNames]

export const monthDayFieldNames = [...dayFieldNames, ...monthFieldNames] // day/month/monthCode
export const monthCodeDayFieldNames = [...dayFieldNames, ...monthCodeFieldNames] // day/monthCode

// Defaults
// -------------------------------------------------------------------------------------------------

export const timeFieldDefaults = mapPropNamesToConstant(timeFieldNamesAsc, 0)
