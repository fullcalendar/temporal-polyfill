import { IsoDateFields, IsoTimeFields, isoTimeFieldNames } from './isoFields'
import { ensureBoolean, ensureInteger, toInteger, toString } from './options'
import { mapPropNames, mapPropNamesToConstant, remapProps } from './utils'

interface EraYearFields {
  era: string
  eraYear: number
}

interface AllYearFields extends EraYearFields {
  year: number
}

interface MonthFields {
  monthCode: string
  month: number
}

type YearMonthFields = { year: number } & MonthFields
type DateFields = YearMonthFields & { day: number }
type MonthDayFields = MonthFields & { day: number }

interface TimeFields {
  hour: number
  microsecond: number
  millisecond: number
  minute: number
  nanosecond: number
  second: number
}

type DateTimeFields = DateFields & TimeFields

interface DateBasics {
  year: number
  month: number
  day: number
}

interface YearMonthBasics {
  year: number
  month: number
}

interface MonthDayBasics {
  monthCode: string
  day: number
}

interface YearStats {
  daysInYear: number
  inLeapYear: boolean
  monthsInYear: number
}
interface YearMonthStats extends YearStats {
  daysInMonth: number
}
interface DateStats extends YearMonthStats {
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

// TODO: temporary
interface CalendarOps {
  id: string
  era(isoFields: IsoDateFields): string | undefined
  eraYear(isoFields: IsoDateFields): number | undefined
  year(isoFields: IsoDateFields): number
  monthCode(isoFields: IsoDateFields): string
  month(isoFields: IsoDateFields): number
  day(isoFields: IsoDateFields): number
  daysInYear(isoFields: IsoDateFields): number
  inLeapYear(isoFields: IsoDateFields): number
  monthsInYear(isoFields: IsoDateFields): number
  daysInMonth(isoFields: IsoDateFields): number
  dayOfWeek(isoFields: IsoDateFields): number
  dayOfYear(isoFields: IsoDateFields): number
  weekOfYear(isoFields: IsoDateFields): number
  yearOfWeek(isoFields: IsoDateFields): number
  daysInWeek(isoFields: IsoDateFields): number
}

type DateMethods = FilterPropValues<CalendarOps, (isoFields: IsoDateFields) => any>

type DateGetters = {
  [K in keyof DateMethods]: (
    internals: IsoDateFields & { calendar: CalendarOps }
  ) => ReturnType<DateMethods[K]>
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

export const yearMonthFieldNames = Object.keys(yearMonthFieldRefiners) as // month/monthCode/year
  (keyof YearMonthFields)[]

export const monthDayFieldNames = dateFieldNames.slice(0, 3) as // day/month/monthCode
  (keyof MonthDayFields)[]

export const monthFieldNames = monthDayFieldNames.slice(1) as // month/monthCode
  (keyof MonthDayFields)[]

export const dateTimeFieldNames = Object.keys(dateTimeFieldRefiners).sort() as
  (keyof DateTimeFields)[]

export const timeFieldNames = Object.keys(timeFieldRefiners) as
  (keyof TimeFields)[]

export const dateBasicNames = ['day', 'month', 'year'] as
  (keyof DateBasics)[]

export const yearMonthBasicNames = yearMonthFieldNames.slice(1) as // monthCode/year
  (keyof YearMonthBasics)[]

export const monthDayBasicNames = ['day', 'monthCode'] as
  (keyof MonthDayBasics)[]

export const yearStatNames = Object.keys(yearStatRefiners) as
  (keyof YearStats)[]

export const yearMonthStatNames = Object.keys(yearMonthStatRefiners) as // unordered
  (keyof YearMonthStats)[]

export const dateStatNames = Object.keys(dateStatRefiners) as // unordered
  (keyof DateStats)[]

export const dateGetterNames = [ // unordered
  ...eraYearFieldNames,
  ...dateFieldNames,
  ...dateStatNames,
]

export const yearMonthGetterNames = [ // unordered
  ...eraYearFieldNames,
  ...yearMonthFieldNames,
  ...yearMonthStatNames,
]

export const monthDayGetterNames = monthDayFieldNames // unordered

// Getters
// -------------------------------------------------------------------------------------------------

function createCalendarGetter<K extends keyof DateGetters>(
  propName: K,
) {
  return (internals: IsoDateFields & { calendar: CalendarOps }) => {
    return internals.calendar[propName](internals) as ReturnType<DateGetters[K]>
  }
}

function createCalendarGetters<K extends keyof DateGetters>(
  propNames: K[],
) {
  const getters = mapPropNames(
    createCalendarGetter as any, // trouble merging prop-vals into single type
    propNames,
  ) as (Pick<DateGetters, K> & CalendarIdGetters)

  getters.calendarId = function(internals) {
    return internals.calendar.id
  }

  return getters
}

export const dateGetters = createCalendarGetters(dateGetterNames)
export const yearMonthGetters = createCalendarGetters(yearMonthGetterNames)
export const monthDayGetters = createCalendarGetters(monthDayGetterNames)

export const timeGetters = mapPropNames<TimeGetters>((fieldName, i) => {
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

export const timeFieldsToIso: (fields: TimeFields) => IsoTimeFields =
  (remapProps as any).bind(undefined, timeFieldNames, isoTimeFieldNames)

// Defaults
// -------------------------------------------------------------------------------------------------

export const timeFieldDefaults = mapPropNamesToConstant(timeFieldNames, 0)
