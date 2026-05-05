import type {
  CalendarDateFields,
  DateStats,
  TimeFields,
  YearMonthStats,
} from './fieldTypes'
import { Unit, unitNamesAsc } from './units'
import { mapPropNamesToConstant, sortStrings } from './utils'

// Types
// -----------------------------------------------------------------------------

type CalendarGetterFieldName =
  | keyof DateStats
  | keyof YearMonthStats
  | 'era'
  | 'eraYear'
  | 'year'
  | 'month'
  | 'monthCode'
  | 'day'

// Atomic Field Names
// -----------------------------------------------------------------------------

export const dayFieldName = 'day'
// Used as a public-facing entity label for move-to-day-of-month helpers. It is
// intentionally distinct from the actual Temporal field name, which is "day".
export const dayOfMonthName = 'dayOfMonth'
export const dayOfWeekFieldName = 'dayOfWeek'
export const weekOfYearFieldName = 'weekOfYear'

// Unit-Orderable Field Name Lists
// -----------------------------------------------------------------------------

export const timeFieldNamesAsc = unitNamesAsc.slice(
  0,
  Unit.Day,
) as (keyof TimeFields)[]
export const yearFieldNamesAsc = ['year']
export const dayFieldNamesAsc = [dayFieldName]
export const calendarDateFieldNamesAsc = [
  ...dayFieldNamesAsc,
  'month',
  ...yearFieldNamesAsc,
] as (keyof CalendarDateFields)[]

// Non-Orderable Field Name Lists
// -----------------------------------------------------------------------------
// These lists include fields outside the numeric date/time core, and their
// order is not numeric unit significance.

const offsetFieldNames = ['offset']

export const timeZoneFieldNames = ['timeZone']

// TODO: try inline these for size
const timeAndOffsetFieldNames = [
  ...timeFieldNamesAsc,
  ...offsetFieldNames,
]
const timeAndZoneFieldNames = [
  ...timeAndOffsetFieldNames,
  ...timeZoneFieldNames,
]

export const eraYearFieldNames = ['era', 'eraYear']

export const allYearFieldNames = [...eraYearFieldNames, 'year']

const monthCodeFieldNames = ['monthCode']

export const monthFieldNames = ['month', ...monthCodeFieldNames] // month/monthCode

// Getter surfaces for PlainDate/PlainYearMonth include both structural calendar
// fields and derived calendar stats. Keep these names independent from
// calendarRefiners so class API mixins can enumerate methods without importing
// the validation functions behind those refiner maps.
const yearMonthStatsFieldNames = [
  'daysInMonth',
  'daysInYear',
  'inLeapYear',
  'monthsInYear',
] as (keyof YearMonthStats)[]

const dateStatsFieldNames = [
  dayOfWeekFieldName,
  weekOfYearFieldName,
  'dayOfYear',
  'yearOfWeek',
  'daysInWeek',
] as (keyof DateStats)[]

export const yearMonthGetterFieldNames = [
  ...eraYearFieldNames,
  ...yearFieldNamesAsc,
  ...yearMonthStatsFieldNames,
  ...monthCodeFieldNames,
  'month',
] as CalendarGetterFieldName[]

export const monthDayGetterFieldNames = [
  ...monthCodeFieldNames,
  ...dayFieldNamesAsc,
] as CalendarGetterFieldName[]

export const dateGetterFieldNames = [
  ...yearMonthGetterFieldNames,
  ...dayFieldNamesAsc,
  ...dateStatsFieldNames,
] as CalendarGetterFieldName[]

export const monthDayFieldNames = [
  ...dayFieldNamesAsc,
  ...monthFieldNames,
]

// Alpha Field Name Lists
// -----------------------------------------------------------------------------
// `Alpha` lists are derived separately for observable bag-read order.

export const timeFieldNamesAlpha = sortStrings(timeFieldNamesAsc)

// FYI, happens to be in alphabetical order
export const yearFieldNamesWithEraAlpha = [
  ...eraYearFieldNames,
  ...yearFieldNamesAsc,
]

// FYI, happens to be in alphabetical order
export const yearMonthFieldNamesAlpha = [
  ...monthFieldNames,
  ...yearFieldNamesAsc,
]

// FYI, happens to be in alphabetical order
export const yearMonthFieldNamesWithEraAlpha = [
  ...eraYearFieldNames,
  ...yearMonthFieldNamesAlpha,
]

// FYI, happens to be in alphabetical order
export const yearMonthCodeFieldNamesAlpha = [
  ...monthCodeFieldNames,
  ...yearFieldNamesAsc,
]

// FYI, happens to be in alphabetical order
export const yearMonthCodeFieldNamesWithEraAlpha = [
  ...eraYearFieldNames,
  ...yearMonthCodeFieldNamesAlpha,
]

// FYI, happens to be in alphabetical order
export const monthCodeDayFieldNamesAlpha = [
  ...dayFieldNamesAsc,
  ...monthCodeFieldNames,
]

export const dateFieldNamesAlpha = sortStrings([
  ...dayFieldNamesAsc,
  ...yearMonthFieldNamesAlpha,
])
export const dateFieldNamesWithEraAlpha = sortStrings([
  ...dayFieldNamesAsc,
  ...eraYearFieldNames,
  ...yearMonthFieldNamesAlpha,
])
export const dateTimeFieldNamesAlpha = sortStrings([
  ...dateFieldNamesAlpha,
  ...timeFieldNamesAsc,
])
export const dateTimeFieldNamesWithEraAlpha = sortStrings(
  [...dateFieldNamesWithEraAlpha, ...timeFieldNamesAsc],
)
export const dateTimeAndOffsetFieldNamesAlpha = sortStrings(
  [...dateFieldNamesAlpha, ...timeAndOffsetFieldNames],
)
export const dateTimeAndOffsetFieldNamesWithEraAlpha = sortStrings(
  [...dateFieldNamesWithEraAlpha, ...timeAndOffsetFieldNames],
)
export const dateTimeAndZoneFieldNamesAlpha = sortStrings(
  [...dateFieldNamesAlpha, ...timeAndZoneFieldNames],
)
export const dateTimeAndZoneFieldNamesWithEraAlpha = sortStrings(
  [...dateFieldNamesWithEraAlpha, ...timeAndZoneFieldNames],
)
// FYI, happens to be in alphabetical order
export const yearMonthCodeDayFieldNamesAlpha = sortStrings(
  [...dayFieldNamesAsc, ...yearMonthCodeFieldNamesAlpha],
)
// FYI, happens to be in alphabetical order
export const yearMonthCodeDayFieldNamesWithEraAlpha = sortStrings(
  [...dayFieldNamesAsc, ...eraYearFieldNames, ...yearMonthCodeFieldNamesAlpha],
)

// Defaults
// -----------------------------------------------------------------------------

// NOTE: bad place for this!
// TODO: rename to zero-time?
export const timeFieldDefaults = mapPropNamesToConstant(timeFieldNamesAsc, 0)
