import type { CalendarDateFields, TimeFields } from './fieldTypes'
import { Unit, unitNamesAsc } from './units'
import { sortStrings, zipPropsConst } from './utils'

// Unit-Ordered Field Name Lists
// -----------------------------------------------------------------------------

export const timeFieldNamesAsc = unitNamesAsc.slice(
  0,
  Unit.Day,
) as (keyof TimeFields)[]

export const timeGetters = timeFieldNamesAsc.reduce(
  (getters, fieldName) => {
    getters[fieldName] = (slots: TimeFields) => slots[fieldName]
    return getters
  },
  {} as { [K in keyof TimeFields]: (slots: TimeFields) => number },
)

export const yearFieldNamesAsc = ['year'] as const
export const dayFieldNamesAsc = ['day'] as const
export const calendarDateFieldNamesAsc = [
  'day',
  'month',
  'year',
] as (keyof CalendarDateFields)[]

// Unordered Field Name Lists
// -----------------------------------------------------------------------------
// These lists include fields outside the numeric date/time core, and their
// order is not numeric unit significance.

const offsetFieldNames = ['offset'] as const
export const timeZoneFieldNames = ['timeZone'] as const
export const eraYearFieldNames = ['era', 'eraYear'] as const
export const allYearFieldNames = ['era', 'eraYear', 'year'] as const
export const monthFieldNames = ['month', 'monthCode'] as const
export const monthDayFieldNames = ['day', 'month', 'monthCode'] as const

// Alpha Field Name Lists
// -----------------------------------------------------------------------------
// `Alpha` lists are derived separately for observable bag-read order.

export const timeFieldNamesAlpha = sortStrings(timeFieldNamesAsc)
export const yearFieldNamesWithEraAlpha = sortStrings(
  eraYearFieldNames,
  yearFieldNamesAsc,
)
export const yearMonthFieldNamesAlpha = sortStrings(
  monthFieldNames,
  yearFieldNamesAsc,
)
export const yearMonthFieldNamesWithEraAlpha = sortStrings(
  eraYearFieldNames,
  yearMonthFieldNamesAlpha,
)
export const yearMonthCodeFieldNamesAlpha = sortStrings(
  ['monthCode'],
  yearFieldNamesAsc,
)
export const yearMonthCodeFieldNamesWithEraAlpha = sortStrings(
  eraYearFieldNames,
  yearMonthCodeFieldNamesAlpha,
)
export const monthCodeDayFieldNamesAlpha = sortStrings(dayFieldNamesAsc, [
  'monthCode',
])
export const dateFieldNamesAlpha = sortStrings(
  dayFieldNamesAsc,
  yearMonthFieldNamesAlpha,
)
export const dateFieldNamesWithEraAlpha = sortStrings(
  dayFieldNamesAsc,
  eraYearFieldNames,
  yearMonthFieldNamesAlpha,
)
export const dateTimeFieldNamesAlpha = sortStrings(
  dateFieldNamesAlpha,
  timeFieldNamesAsc,
)
export const dateTimeFieldNamesWithEraAlpha = sortStrings(
  dateFieldNamesWithEraAlpha,
  timeFieldNamesAsc,
)
export const dateTimeAndOffsetFieldNamesAlpha = sortStrings(
  dateFieldNamesAlpha,
  timeFieldNamesAsc,
  offsetFieldNames,
)
export const dateTimeAndOffsetFieldNamesWithEraAlpha = sortStrings(
  dateFieldNamesWithEraAlpha,
  timeFieldNamesAsc,
  offsetFieldNames,
)
export const dateTimeAndZoneFieldNamesAlpha = sortStrings(
  dateFieldNamesAlpha,
  timeFieldNamesAsc,
  offsetFieldNames,
  timeZoneFieldNames,
)
export const dateTimeAndZoneFieldNamesWithEraAlpha = sortStrings(
  dateFieldNamesWithEraAlpha,
  timeFieldNamesAsc,
  offsetFieldNames,
  timeZoneFieldNames,
)
export const yearMonthCodeDayFieldNamesAlpha = sortStrings(
  dayFieldNamesAsc,
  yearMonthCodeFieldNamesAlpha,
)
export const yearMonthCodeDayFieldNamesWithEraAlpha = sortStrings(
  dayFieldNamesAsc,
  eraYearFieldNames,
  yearMonthCodeFieldNamesAlpha,
)

// Defaults
// -----------------------------------------------------------------------------

// NOTE: bad place for this!
// TODO: rename to zero-time?
export const timeFieldDefaults = zipPropsConst(timeFieldNamesAsc, 0)
