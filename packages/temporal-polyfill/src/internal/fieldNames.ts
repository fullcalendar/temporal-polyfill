import type { CalendarDateFields, TimeFields } from './fieldTypes'
import { Unit, unitNamesAsc } from './units'
import { sortStrings, zipPropsConst } from './utils'

// Atomic Field Names
// -----------------------------------------------------------------------------

// Used as a public-facing entity label for move-to-day-of-month helpers. It is
// intentionally distinct from the actual Temporal field name, which is "day".
export const dayFieldName = 'day'
export const dayOfMonthName = 'dayOfMonth'
export const dayOfWeekFieldName = 'dayOfWeek'
export const weekOfYearFieldName = 'weekOfYear'

// Unit-Ordered Field Name Lists
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

// Unordered Field Name Lists
// -----------------------------------------------------------------------------
// These lists include fields outside the numeric date/time core, and their
// order is not numeric unit significance.

const offsetFieldNames = ['offset']
export const timeZoneFieldNames = ['timeZone']
export const eraYearFieldNames = ['era', 'eraYear']
export const allYearFieldNames = [...eraYearFieldNames, ...yearFieldNamesAsc]
const monthCodeFieldNames = ['monthCode']
export const monthFieldNames = ['month', ...monthCodeFieldNames] // month/monthCode
export const monthDayFieldNames = [...dayFieldNamesAsc, ...monthFieldNames]

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
  monthCodeFieldNames,
  yearFieldNamesAsc,
)
export const yearMonthCodeFieldNamesWithEraAlpha = sortStrings(
  eraYearFieldNames,
  yearMonthCodeFieldNamesAlpha,
)
export const monthCodeDayFieldNamesAlpha = sortStrings(
  dayFieldNamesAsc,
  monthCodeFieldNames,
)
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
