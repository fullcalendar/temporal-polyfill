import type {
  CalendarDateFields,
  CalendarDateTimeFields,
  DateStats,
  TimeFields,
  YearMonthStats,
} from './fieldTypes'
import { Unit, unitNamesAsc } from './units'
import { mapPropNamesToConstant, sortStrings } from './utils'

export type CalendarGetterFieldName =
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
export const dayFieldName = 'day'
// Used as a public-facing entity label for move-to-day-of-month helpers. It is
// intentionally distinct from the actual Temporal field name, which is "day".
export const dayOfMonthName = 'dayOfMonth'
export const dayOfWeekFieldName = 'dayOfWeek'
export const weekOfYearFieldName = 'weekOfYear'
export const dayFieldNames = [dayFieldName]

// Getter surfaces for PlainDate/PlainYearMonth include both structural calendar
// fields and derived calendar stats. Keep these names independent from
// calendarRefiners so class API mixins can enumerate methods without importing
// the validation functions behind those refiner maps.
export const yearMonthStatsFieldNames = [
  'daysInMonth',
  'daysInYear',
  'inLeapYear',
  'monthsInYear',
] as (keyof YearMonthStats)[]
export const dateStatsFieldNames = [
  dayOfWeekFieldName,
  'dayOfYear',
  weekOfYearFieldName,
  'yearOfWeek',
  'daysInWeek',
] as (keyof DateStats)[]
export const yearMonthGetterFieldNames = [
  ...eraYearFieldNames,
  ...yearFieldNames,
  'month',
  ...yearMonthStatsFieldNames,
  ...monthCodeFieldNames,
] as CalendarGetterFieldName[]
export const monthDayGetterFieldNames = [
  ...monthCodeFieldNames,
  ...dayFieldNames,
] as CalendarGetterFieldName[]
export const dateGetterFieldNames = [
  ...yearMonthGetterFieldNames,
  ...dayFieldNames,
  ...dateStatsFieldNames,
] as CalendarGetterFieldName[]

export const calendarDateFieldNamesAsc = [
  ...dayFieldNames,
  'month',
  ...yearFieldNames,
] as (keyof CalendarDateFields)[]
export const calendarDateTimeFieldNamesAsc = [
  ...timeFieldNamesAsc,
  ...calendarDateFieldNamesAsc,
] as (keyof CalendarDateTimeFields)[]

export const calendarDateFieldNamesAlpha = sortStrings(
  calendarDateFieldNamesAsc,
)
export const calendarDateTimeFieldNamesAlpha = sortStrings(
  calendarDateTimeFieldNamesAsc,
)

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

// NOTE: bad place for this!
export const timeFieldDefaults = mapPropNamesToConstant(timeFieldNamesAsc, 0)
