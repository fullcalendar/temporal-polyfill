import { DayTimeNano } from './dayTimeNano'
import { durationHasDateParts } from './durationMath'
import {
  DayTimeUnit,
  TimeUnit,
  Unit,
  givenFieldsToDayTimeNano,
  nanoInUtcDay,
  nanoToGivenFields,
  unitNamesAsc,
  unitNanoMap,
} from './units'
import {
  mapPropNamesToConstant,
  mapPropNamesToIndex,
} from './utils'

export interface DurationDateFields {
  days: number
  weeks: number
  months: number
  years: number
}

export interface DurationTimeFields {
  nanoseconds: number
  microseconds: number
  milliseconds: number
  seconds: number
  minutes: number
  hours: number
}

export type DurationFields = DurationDateFields & DurationTimeFields

// Field Names
// -------------------------------------------------------------------------------------------------

export const durationFieldNamesAsc = unitNamesAsc.map((unitName) => unitName + 's') as (keyof DurationFields)[]
export const durationFieldNamesAlpha = durationFieldNamesAsc.slice().sort()
export const durationTimeFieldNamesAsc = durationFieldNamesAsc.slice(0, Unit.Day)
export const durationDateFieldNamesAsc = durationFieldNamesAsc.slice(Unit.Day)

export const durationFieldIndexes = mapPropNamesToIndex(durationFieldNamesAsc)

// Field Defaults
// -------------------------------------------------------------------------------------------------

export const durationFieldDefaults = mapPropNamesToConstant(durationFieldNamesAsc, 0)
export const durationTimeFieldDefaults = mapPropNamesToConstant(durationTimeFieldNamesAsc, 0)

// Field <-> Nanosecond Conversion
// -------------------------------------------------------------------------------------------------

export function durationTimeFieldsToLargeNanoStrict(fields: DurationFields): DayTimeNano {
  if (durationHasDateParts(fields)) {
    throw new RangeError('Operation not allowed') // correct error?
  }

  return durationFieldsToDayTimeNano(fields, Unit.Hour)
}

export function durationFieldsToDayTimeNano(fields: DurationFields, largestUnit: DayTimeUnit): DayTimeNano {
  return givenFieldsToDayTimeNano(fields, largestUnit, durationFieldNamesAsc)
}

export function nanoToDurationDayTimeFields(largeNano: DayTimeNano): { days: number } & DurationTimeFields
export function nanoToDurationDayTimeFields(largeNano: DayTimeNano, largestUnit?: DayTimeUnit): Partial<DurationFields>
export function nanoToDurationDayTimeFields(
  dayTimeNano: DayTimeNano,
  largestUnit: DayTimeUnit = Unit.Day,
): Partial<DurationFields> {
  const [days, timeNano] = dayTimeNano
  const dayTimeFields = nanoToGivenFields(timeNano, largestUnit, durationFieldNamesAsc)

  dayTimeFields[durationFieldNamesAsc[largestUnit]]! +=
    days * (nanoInUtcDay / unitNanoMap[largestUnit])

  if (!Number.isFinite(dayTimeFields[durationFieldNamesAsc[largestUnit]]!)) {
    throw new RangeError('Too big')
  }

  return dayTimeFields
}

// audit
export function nanoToDurationTimeFields(nano: number): DurationTimeFields
export function nanoToDurationTimeFields(nano: number, largestUnit: TimeUnit): Partial<DurationTimeFields>
export function nanoToDurationTimeFields(
  nano: number,
  largestUnit: TimeUnit = Unit.Hour,
): Partial<DurationTimeFields> {
  return nanoToGivenFields(nano, largestUnit, durationFieldNamesAsc as (keyof DurationTimeFields)[])
}

/*
Returns all units
*/
export function clearDurationFields(
  durationFields: DurationFields,
  largestUnitToClear: Unit,
): DurationFields {
  const copy = { ...durationFields }

  for (let unit: Unit = Unit.Nanosecond; unit <= largestUnitToClear; unit++) {
    copy[durationFieldNamesAsc[unit]] = 0
  }

  return copy
}

export function isDurationsEqual(
  a: DurationFields,
  b: DurationFields,
): boolean {
  return a.years === b.years &&
    a.months === b.months &&
    a.weeks === b.weeks &&
    a.days === b.days &&
    a.hours === b.hours &&
    a.minutes === b.minutes &&
    a.seconds === b.seconds &&
    a.milliseconds === b.milliseconds &&
    a.microseconds === b.microseconds &&
    a.nanoseconds === b.nanoseconds
}
