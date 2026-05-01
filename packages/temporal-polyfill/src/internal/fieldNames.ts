import type {
  CalendarDateFields,
  DateStats,
  TimeFields,
  YearMonthStats,
} from './fieldTypes'
import { Unit, unitNamesAsc } from './units'
import { mapPropNamesToConstant, sortStrings } from './utils'

type CalendarGetterFieldName =
  | keyof DateStats
  | keyof YearMonthStats
  | 'era'
  | 'eraYear'
  | 'year'
  | 'month'
  | 'monthCode'
  | 'day'

// Field Names
// -----------------------------------------------------------------------------
// `Asc` lists are the source definitions. `Alpha` lists are derived as a
// separate pass for observable bag-read order.

export const timeFieldNamesAsc = unitNamesAsc.slice(
  0,
  Unit.Day,
) as (keyof TimeFields)[]

export const timeFieldNamesAlpha = sortStrings(timeFieldNamesAsc)

const offsetFieldNamesAsc = ['offset']
export const timeZoneFieldNamesAsc = ['timeZone']

const timeAndOffsetFieldNamesAsc = [
  ...timeFieldNamesAsc,
  ...offsetFieldNamesAsc,
]
const timeAndZoneFieldNamesAsc = [
  ...timeAndOffsetFieldNamesAsc,
  ...timeZoneFieldNamesAsc,
]

export const eraYearFieldNamesAsc = ['era', 'eraYear']
export const allYearFieldNamesAsc = [...eraYearFieldNamesAsc, 'year']

export const yearFieldNamesAsc = ['year']
export const yearFieldNamesWithEraAsc = [
  ...eraYearFieldNamesAsc,
  ...yearFieldNamesAsc,
]
const monthCodeFieldNamesAsc = ['monthCode']
export const monthFieldNamesAsc = ['month', ...monthCodeFieldNamesAsc] // month/monthCode
export const dayFieldName = 'day'
// Used as a public-facing entity label for move-to-day-of-month helpers. It is
// intentionally distinct from the actual Temporal field name, which is "day".
export const dayOfMonthName = 'dayOfMonth'
export const dayOfWeekFieldName = 'dayOfWeek'
export const weekOfYearFieldName = 'weekOfYear'
export const dayFieldNamesAsc = [dayFieldName]

// Getter surfaces for PlainDate/PlainYearMonth include both structural calendar
// fields and derived calendar stats. Keep these names independent from
// calendarRefiners so class API mixins can enumerate methods without importing
// the validation functions behind those refiner maps.
const yearMonthStatsFieldNamesAsc = [
  'daysInMonth',
  'daysInYear',
  'inLeapYear',
  'monthsInYear',
] as (keyof YearMonthStats)[]
const dateStatsFieldNamesAsc = [
  dayOfWeekFieldName,
  'dayOfYear',
  weekOfYearFieldName,
  'yearOfWeek',
  'daysInWeek',
] as (keyof DateStats)[]
export const yearMonthGetterFieldNamesAsc = [
  ...eraYearFieldNamesAsc,
  ...yearFieldNamesAsc,
  'month',
  ...yearMonthStatsFieldNamesAsc,
  ...monthCodeFieldNamesAsc,
] as CalendarGetterFieldName[]
export const monthDayGetterFieldNamesAsc = [
  ...monthCodeFieldNamesAsc,
  ...dayFieldNamesAsc,
] as CalendarGetterFieldName[]
export const dateGetterFieldNamesAsc = [
  ...yearMonthGetterFieldNamesAsc,
  ...dayFieldNamesAsc,
  ...dateStatsFieldNamesAsc,
] as CalendarGetterFieldName[]

export const calendarDateFieldNamesAsc = [
  ...dayFieldNamesAsc,
  'month',
  ...yearFieldNamesAsc,
] as (keyof CalendarDateFields)[]

export const yearMonthFieldNamesAsc = [
  ...monthFieldNamesAsc,
  ...yearFieldNamesAsc,
]
export const yearMonthFieldNamesWithEraAsc = [
  ...eraYearFieldNamesAsc,
  ...yearMonthFieldNamesAsc,
]

// monthCode/year
export const yearMonthCodeFieldNamesAsc = [
  ...monthCodeFieldNamesAsc,
  ...yearFieldNamesAsc,
]
export const yearMonthCodeFieldNamesWithEraAsc = [
  ...eraYearFieldNamesAsc,
  ...yearMonthCodeFieldNamesAsc,
]

const dateFieldNamesAsc = [...dayFieldNamesAsc, ...yearMonthFieldNamesAsc]
const dateFieldNamesWithEraAsc = [
  ...dayFieldNamesAsc,
  ...eraYearFieldNamesAsc,
  ...yearMonthFieldNamesAsc,
]
const dateTimeFieldNamesAsc = [...dateFieldNamesAsc, ...timeFieldNamesAsc]
const dateTimeFieldNamesWithEraAsc = [
  ...dateFieldNamesWithEraAsc,
  ...timeFieldNamesAsc,
]
const dateTimeAndOffsetFieldNamesAsc = [
  ...dateFieldNamesAsc,
  ...timeAndOffsetFieldNamesAsc,
]
const dateTimeAndOffsetFieldNamesWithEraAsc = [
  ...dateFieldNamesWithEraAsc,
  ...timeAndOffsetFieldNamesAsc,
]
const dateTimeAndZoneFieldNamesAsc = [
  ...dateFieldNamesAsc,
  ...timeAndZoneFieldNamesAsc,
]
const dateTimeAndZoneFieldNamesWithEraAsc = [
  ...dateFieldNamesWithEraAsc,
  ...timeAndZoneFieldNamesAsc,
]

export const dateFieldNamesAlpha = sortStrings(dateFieldNamesAsc)
export const dateFieldNamesWithEraAlpha = sortStrings(dateFieldNamesWithEraAsc)
export const dateTimeFieldNamesAlpha = sortStrings(dateTimeFieldNamesAsc)
export const dateTimeFieldNamesWithEraAlpha = sortStrings(
  dateTimeFieldNamesWithEraAsc,
)
export const dateTimeAndOffsetFieldNamesAlpha = sortStrings(
  dateTimeAndOffsetFieldNamesAsc,
)
export const dateTimeAndOffsetFieldNamesWithEraAlpha = sortStrings(
  dateTimeAndOffsetFieldNamesWithEraAsc,
)
export const dateTimeAndZoneFieldNamesAlpha = sortStrings(
  dateTimeAndZoneFieldNamesAsc,
)
export const dateTimeAndZoneFieldNamesWithEraAlpha = sortStrings(
  dateTimeAndZoneFieldNamesWithEraAsc,
)

export const monthDayFieldNamesAsc = [
  ...dayFieldNamesAsc,
  ...monthFieldNamesAsc,
]
export const monthCodeDayFieldNamesAsc = [
  ...dayFieldNamesAsc,
  ...monthCodeFieldNamesAsc,
]
const yearMonthCodeDayFieldNamesAsc = [
  ...dayFieldNamesAsc,
  ...yearMonthCodeFieldNamesAsc,
]
const yearMonthCodeDayFieldNamesWithEraAsc = [
  ...dayFieldNamesAsc,
  ...eraYearFieldNamesAsc,
  ...yearMonthCodeFieldNamesAsc,
]
export const yearMonthCodeDayFieldNamesAlpha = sortStrings(
  yearMonthCodeDayFieldNamesAsc,
)
export const yearMonthCodeDayFieldNamesWithEraAlpha = sortStrings(
  yearMonthCodeDayFieldNamesWithEraAsc,
)

// NOTE: bad place for this!
// TODO: rename to zero-time?
export const timeFieldDefaults = mapPropNamesToConstant(timeFieldNamesAsc, 0)
