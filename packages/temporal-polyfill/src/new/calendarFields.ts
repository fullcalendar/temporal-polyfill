import {
  CalendarOps,
  IsoDateFields,
  IsoDateInternals,
  IsoTimeFields,
  isoTimeFieldNames,
} from './isoFields'
import { ensureBoolean, ensureInteger, toInteger, toString } from './options'
import { mapPropNames, mapPropNamesToConstant, remapProps } from './utils'

export interface EraYearFields {
  era: string
  eraYear: number
}

export interface AllYearFields extends EraYearFields {
  year: number
}

export interface MonthFields {
  monthCode: string
  month: number
}

type YearMonthFields = { year: number } & MonthFields
export type DateFields = YearMonthFields & { day: number }
type MonthDayFields = MonthFields & { day: number }

export interface TimeFields {
  hour: number
  microsecond: number
  millisecond: number
  minute: number
  nanosecond: number
  second: number
}

type DateTimeFields = DateFields & TimeFields

export interface DateBasics {
  year: number
  month: number
  day: number
}

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

// TODO: move
type FilterPropValues<P, F> = {
  [K in keyof P as P[K] extends F ? K : never]: P[K]
}

type DateMethods = FilterPropValues<CalendarOps, (isoFields: IsoDateFields) => any>

type DateGetters = {
  [K in keyof DateMethods]: (internals: IsoDateInternals) => ReturnType<DateMethods[K]>
}

type TimeGetters = {
  [K in keyof TimeFields]: (isoFields: IsoTimeFields) => number
}

type CalendarIdGetters = {
  calendarId: (internals: { calendar: CalendarOps }) => string
}

// Refiners
// -------------------------------------------------------------------------------------------------

const dayFieldRefiners = { day: toInteger }
const monthCodeFieldRefiners = { monthCode: toString }

// Ordered alphabetically
export const eraYearFieldRefiners = {
  era: toString,
  eraYear: toInteger,
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
  daysInYear: ensureInteger,
  inLeapYear: ensureBoolean,
  monthsInYear: ensureInteger,
}

// Unordered
export const yearMonthStatRefiners = {
  ...yearStatRefiners,
  daysInMonth: ensureInteger,
}

// Unordered
export const dateStatRefiners = {
  ...yearMonthStatRefiners,
  dayOfWeek: ensureInteger,
  dayOfYear: ensureInteger,
  weekOfYear: ensureInteger,
  yearOfWeek: ensureInteger,
  daysInWeek: ensureInteger,
}

// Property Names
// -------------------------------------------------------------------------------------------------

export const eraYearFieldNames = Object.keys(eraYearFieldRefiners) as
  (keyof EraYearFields)[]

export const allYearFieldNames = [...eraYearFieldNames, 'year'] as
  (keyof AllYearFields)[]

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
  (keyof MonthDayFields)[]

export const dateTimeFieldNames = Object.keys(dateTimeFieldRefiners).sort() as
  (keyof DateTimeFields)[]

export const timeFieldNames = Object.keys(timeFieldRefiners) as
  (keyof TimeFields)[]

export const dateBasicNames = ['day', 'month', 'year'] as
  (keyof DateBasics)[]

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

// unordered
export const dateGetterNames = [
  ...eraYearFieldNames,
  ...dateFieldNames,
  ...dateStatNames,
]

// unordered
export const yearMonthGetterNames = [
  ...eraYearFieldNames,
  ...yearMonthFieldNames,
  ...yearMonthStatNames,
]

// unordered
export const monthDayGetterNames = monthDayFieldNames

// Getters
// -------------------------------------------------------------------------------------------------

function createCalendarGetter<K extends keyof DateGetters>(propName: K) {
  return (internals: IsoDateInternals) => {
    return internals.calendar[propName](internals) as ReturnType<DateGetters[K]>
  }
}

type CalendarGetters<K extends keyof DateGetters> = Pick<DateGetters, K> & CalendarIdGetters

function createCalendarGetters<K extends keyof DateGetters>(
  propNames: K[],
): CalendarGetters<K> {
  const getters = mapPropNames(createCalendarGetter, propNames)

  ;(getters as any).calendarId = (internals: { calendar: CalendarOps }) => {
    return internals.calendar.id
  }

  return getters as unknown as CalendarGetters<K>
}

export const dateGetters = createCalendarGetters(dateGetterNames)
export const yearMonthGetters = createCalendarGetters(yearMonthGetterNames)
export const monthDayGetters = createCalendarGetters(monthDayGetterNames)

export const timeGetters = mapPropNames((fieldName, i) => {
  return (isoTimeFields: IsoTimeFields) => {
    return isoTimeFields[isoTimeFieldNames[i]]
  }
}, timeFieldNames)

export const dateTimeGetters = {
  ...dateGetters,
  ...timeGetters,
}

// Conversion
// -------------------------------------------------------------------------------------------------

export const timeFieldsToIso = remapProps.bind<
  any, [any, any], // bound
  [TimeFields], // unbound
  IsoTimeFields // return
>(undefined, timeFieldNames, isoTimeFieldNames)

// Defaults
// -------------------------------------------------------------------------------------------------

export const timeFieldDefaults = mapPropNamesToConstant(timeFieldNames, 0)
