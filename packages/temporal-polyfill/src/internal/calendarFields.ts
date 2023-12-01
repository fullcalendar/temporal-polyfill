import { IsoTimeFields, isoTimeFieldNames } from './isoFields'
import { ensureBoolean, ensureInteger, ensureIntegerOrUndefined, ensurePositiveInteger, ensureString, ensureStringOrUndefined, toInteger, toIntegerOrUndefined, toString, toStringOrUndefined } from './cast'
import { BoundArg, mapPropNamesToConstant, remapProps } from './utils'
import { DurationFields } from './durationFields'

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

export interface YearMonthBasics {
  year: number
  month: number
}

export interface MonthDayBasics {
  monthCode: string
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

// Refiners
// -------------------------------------------------------------------------------------------------

const dayFieldRefiners = { day: toInteger }
const monthCodeFieldRefiners = { monthCode: toString }

// Ordered alphabetically
export const eraYearFieldRefiners = {
  era: toStringOrUndefined,
  eraYear: toIntegerOrUndefined,
}

// Ordered alphabetically
// Does not include era/eraYear
const yearMonthFieldRefiners = {
  month: toInteger,
  ...monthCodeFieldRefiners,
  year: toInteger,
}

// Ordered alphabetically
// Does not include era/eraYear
export const dateFieldRefiners = {
  ...dayFieldRefiners,
  ...yearMonthFieldRefiners,
}

// Ordered alphabetically
const timeFieldRefiners = {
  hour: toInteger,
  microsecond: toInteger,
  millisecond: toInteger,
  minute: toInteger,
  nanosecond: toInteger,
  second: toInteger,
}

// Unordered
// Does not include era/eraYear
export const dateTimeFieldRefiners = {
  ...dateFieldRefiners,
  ...timeFieldRefiners,
}

// Ordered alphabetically, for predictable macros
const yearStatRefiners = {
  daysInYear: ensurePositiveInteger,
  inLeapYear: ensureBoolean,
  monthsInYear: ensurePositiveInteger,
}

// Unordered
export const yearMonthStatRefiners = {
  ...yearStatRefiners,
  daysInMonth: ensurePositiveInteger,
}

// Unordered
export const dateStatRefiners = {
  ...yearMonthStatRefiners,
  dayOfWeek: ensurePositiveInteger,
  dayOfYear: ensurePositiveInteger,
  weekOfYear: ensurePositiveInteger,
  yearOfWeek: ensureInteger, // allows negative
  daysInWeek: ensurePositiveInteger,
}

// Property Names
// -------------------------------------------------------------------------------------------------

export const eraYearFieldNames = Object.keys(eraYearFieldRefiners) as
  (keyof EraYearFields)[]

// eraYearAndYearFieldNames
export const intlYearFieldNames = [...eraYearFieldNames, 'year'] as
  (keyof YearFieldsIntl)[]

export const dateFieldNames = Object.keys(dateFieldRefiners) as
  (keyof DateFields)[]

// month/monthCode/year
export const yearMonthFieldNames = Object.keys(yearMonthFieldRefiners) as
  (keyof YearMonthFields)[]

// day/month/monthCode
export const monthDayFieldNames = dateFieldNames.slice(0, 3) as
  (keyof MonthDayFields)[]

// month/monthCode
export const monthFieldNames = monthDayFieldNames.slice(1) as
  (keyof MonthFields)[]

export const dateTimeFieldNames = Object.keys(dateTimeFieldRefiners).sort() as
  (keyof DateTimeFields)[]

export const timeFieldNames = Object.keys(timeFieldRefiners) as
  (keyof TimeFields)[]

// monthCode/year
export const yearMonthBasicNames = yearMonthFieldNames.slice(1) as
  (keyof YearMonthBasics)[]

export const monthDayBasicNames = ['day', 'monthCode'] as
  (keyof MonthDayBasics)[]

export const yearStatNames = Object.keys(yearStatRefiners) as
  (keyof YearStats)[]

// unordered
export const yearMonthStatNames = Object.keys(yearMonthStatRefiners) as
  (keyof YearMonthStats)[]

// unordered
export const dateStatNames = Object.keys(dateStatRefiners) as
  (keyof DateStats)[]

export type DateGetterFields = DateFieldsIntl & DateStats

export const dateFieldOnlyRefiners = {
  // ...eraYearFieldRefiners,
  // HACK: use strict instead...
  era: ensureStringOrUndefined,
  eraYear: ensureIntegerOrUndefined,

  // ...dateFieldRefiners,
  // HACK: use strict instead...
  year: ensureInteger,
  monthCode: ensureString,
  month: ensurePositiveInteger,
  day: ensurePositiveInteger,
}

export const dateGetterRefiners = {
  ...dateFieldOnlyRefiners,
  ...dateStatRefiners, // already strict
}

// unordered
// HACK: IMPORTANT that first two props are era/eraYear for slicing in calendarProtocolMethodNames...
export const dateGetterNames = Object.keys(dateGetterRefiners) as
  (keyof DateGetterFields)[]

export const calendarProtocolMethodNames: string[] = [
  ...dateGetterNames.slice(2), // remove era/eraYear. HACKY
  'dateAdd',
  'dateUntil',
  'dateFromFields',
  'yearMonthFromFields',
  'monthDayFromFields',
  'fields',
  'mergeFields'
]

// unordered
export const yearMonthGetterNames = [
  ...eraYearFieldNames,
  ...yearMonthFieldNames,
  ...yearMonthStatNames,
]

// unordered
export const monthDayGetterNames = monthDayFieldNames

// Conversion
// -------------------------------------------------------------------------------------------------

export const timeFieldsToIso = remapProps.bind<
  undefined, [BoundArg, BoundArg], // bound
  [TimeFields], // unbound
  IsoTimeFields // return
>(undefined, timeFieldNames, isoTimeFieldNames)

// Defaults
// -------------------------------------------------------------------------------------------------

export const timeFieldDefaults = mapPropNamesToConstant(timeFieldNames, 0)
