import { mapPropNamesToConstant } from './utils'
import { DurationFields } from './durationFields'
import { Unit, unitNamesAsc } from './units'

// Basics
// -------------------------------------------------------------------------------------------------

export interface YearBasics {
  year: number
}

export interface DateBasics extends YearBasics {
  month: number
  day: number
}

// Fields
// -------------------------------------------------------------------------------------------------

export interface EraYearFields {
  era: string
  eraYear: number
}

export type YearFields = YearBasics & Partial<EraYearFields>

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

export interface TimeFields {
  hour: number
  microsecond: number
  millisecond: number
  minute: number
  nanosecond: number
  second: number
}

export type DateTimeFields = DateFields & TimeFields

// Simple Bag (all props optional)
// -------------------------------------------------------------------------------------------------

export type YearMonthBag = Partial<YearMonthFields>
export type DateBag = Partial<DateFields>
export type MonthDayBag = Partial<MonthDayFields>
export type DurationBag = Partial<DurationFields>
export type TimeBag = Partial<TimeFields>
export type DateTimeBag = DateBag & TimeBag

// Strict Bag (with complex expressions)
// -------------------------------------------------------------------------------------------------

export type EraYearOrYear = EraYearFields | YearBasics
export type MonthCodeOrMonthAndYear = { monthCode: string } | ({ month: number } & EraYearOrYear)
export type MonthCodeOrMonth = { monthCode: string } | { month: number }

export type YearMonthBagStrict = EraYearOrYear & MonthCodeOrMonth
export type DateBagStrict = EraYearOrYear & MonthCodeOrMonth & DayFields
export type MonthDayBagStrict = MonthCodeOrMonthAndYear & DayFields

// Stats
// -------------------------------------------------------------------------------------------------

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