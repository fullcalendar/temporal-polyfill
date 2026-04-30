import { DurationFields } from './durationFields'
import { Unit, unitNamesAsc } from './units'
import { mapPropNamesToConstant, sortStrings } from './utils'

// Fields
// -----------------------------------------------------------------------------

export interface EraYearFields {
  era: string
  eraYear: number
}

export type YearFields = Partial<EraYearFields> & { year: number }

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
// -----------------------------------------------------------------------------

export type YearMonthBag = Partial<YearMonthFields>
export type DateBag = Partial<DateFields>
export type MonthDayBag = Partial<MonthDayFields>
export type DurationBag = Partial<DurationFields>
export type TimeBag = Partial<TimeFields>
export type DateTimeBag = DateBag & TimeBag

// Strict Bag (with complex expressions)
// -----------------------------------------------------------------------------

export type EraYearOrYear = EraYearFields | { year: number }
export type MonthCodeOrMonthAndYear =
  | { monthCode: string }
  | ({ month: number } & EraYearOrYear)
export type MonthCodeOrMonth = { monthCode: string } | { month: number }

export type YearMonthBagStrict = EraYearOrYear & MonthCodeOrMonth
export type DateBagStrict = EraYearOrYear & MonthCodeOrMonth & DayFields
export type MonthDayBagStrict = MonthCodeOrMonthAndYear & DayFields

// Stats
// -----------------------------------------------------------------------------

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
// -----------------------------------------------------------------------------
// TODO: converge on 'alpha' naming or not

export const timeFieldNamesAsc = unitNamesAsc.slice(
  0,
  Unit.Day,
) as (keyof TimeFields)[]

export const timeFieldNamesAlpha = sortStrings(timeFieldNamesAsc)

export const offsetFieldNames = ['offset']
export const timeZoneFieldNames = ['timeZone']

export const timeAndOffsetFieldNames = [
  ...timeFieldNamesAsc,
  ...offsetFieldNames,
]
export const timeAndZoneFieldNames = [
  ...timeAndOffsetFieldNames,
  ...timeZoneFieldNames,
]
export const timeAndOffsetFieldNamesAlpha = sortStrings(timeAndOffsetFieldNames)
export const timeAndZoneFieldNamesAlpha = sortStrings(timeAndZoneFieldNames)

// pre-sorted!!!...

export const eraYearFieldNames = ['era', 'eraYear']
export const allYearFieldNames = [...eraYearFieldNames, 'year']

export const yearFieldNames = ['year']
export const yearFieldNamesWithEra = [...eraYearFieldNames, ...yearFieldNames]
export const monthCodeFieldNames = ['monthCode']
export const monthFieldNames = ['month', ...monthCodeFieldNames] // month/monthCode
export const dayFieldNames = ['day']

// month/monthCode/year
export const yearMonthFieldNames = [...monthFieldNames, ...yearFieldNames]
export const yearMonthFieldNamesWithEra = [
  ...eraYearFieldNames,
  ...yearMonthFieldNames,
]

// monthCode/year
export const yearMonthCodeFieldNames = [
  ...monthCodeFieldNames,
  ...yearFieldNames,
]
export const yearMonthCodeFieldNamesWithEra = [
  ...eraYearFieldNames,
  ...yearMonthCodeFieldNames,
]

export const dateFieldNamesAlpha = [...dayFieldNames, ...yearMonthFieldNames]
export const dateFieldNamesAlphaWithEra = [
  ...dayFieldNames,
  ...eraYearFieldNames,
  ...yearMonthFieldNames,
]
export const dateTimeFieldNamesAlpha = sortStrings([
  ...dateFieldNamesAlpha,
  ...timeFieldNamesAlpha,
])
export const dateTimeFieldNamesAlphaWithEra = sortStrings([
  ...dateFieldNamesAlphaWithEra,
  ...timeFieldNamesAlpha,
])
export const dateTimeAndOffsetFieldNamesAlpha = sortStrings([
  ...dateFieldNamesAlpha,
  ...timeAndOffsetFieldNamesAlpha,
])
export const dateTimeAndOffsetFieldNamesAlphaWithEra = sortStrings([
  ...dateFieldNamesAlphaWithEra,
  ...timeAndOffsetFieldNamesAlpha,
])
export const dateTimeAndZoneFieldNamesAlpha = sortStrings([
  ...dateFieldNamesAlpha,
  ...timeAndZoneFieldNamesAlpha,
])
export const dateTimeAndZoneFieldNamesAlphaWithEra = sortStrings([
  ...dateFieldNamesAlphaWithEra,
  ...timeAndZoneFieldNamesAlpha,
])

export const monthDayFieldNames = [...dayFieldNames, ...monthFieldNames] // day/month/monthCode
export const monthCodeDayFieldNames = [...dayFieldNames, ...monthCodeFieldNames] // day/monthCode
export const yearMonthCodeDayFieldNamesAlpha = [
  ...dayFieldNames,
  ...yearMonthCodeFieldNames,
]
export const yearMonthCodeDayFieldNamesAlphaWithEra = [
  ...dayFieldNames,
  ...eraYearFieldNames,
  ...yearMonthCodeFieldNames,
]

// Defaults
// -----------------------------------------------------------------------------

export const timeFieldDefaults = mapPropNamesToConstant(timeFieldNamesAsc, 0)
