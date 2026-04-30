import type { TimeFields } from './fieldTypes'
import { Unit, unitNamesAsc } from './units'
import { mapPropNamesToConstant, sortStrings } from './utils'

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

// NOTE: bad place for this!
export const timeFieldDefaults = mapPropNamesToConstant(timeFieldNamesAsc, 0)
