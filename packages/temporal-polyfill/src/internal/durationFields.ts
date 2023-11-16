import { toIntegerStrict } from './cast'
import { DayTimeNano, addDayTimeNanos } from './dayTimeNano'
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
  NumSign,
  mapPropNames,
  mapPropNamesToConstant,
  mapPropNamesToIndex,
  mapProps,
} from './utils'

interface DurationDateFields {
  days: number
  weeks: number
  months: number
  years: number
}

interface DurationTimeFields {
  nanoseconds: number
  microseconds: number
  milliseconds: number
  seconds: number
  minutes: number
  hours: number
}

export type DurationFields = DurationDateFields & DurationTimeFields

export interface DurationInternals extends DurationFields {
  sign: NumSign
}

// Property Names
// -------------------------------------------------------------------------------------------------

// pluralized
export const durationFieldNamesAsc = unitNamesAsc.map((unitName) => unitName + 's') as
  (keyof DurationFields)[]

export const durationFieldIndexes = mapPropNamesToIndex(durationFieldNamesAsc)

export const durationFieldNames = durationFieldNamesAsc.slice().sort()

const durationTimeFieldNamesAsc = durationFieldNamesAsc.slice(0, Unit.Day) as
  (keyof DurationTimeFields)[]

const durationDateFieldNamesAsc = durationFieldNamesAsc.slice(Unit.Day) as
  (keyof DurationDateFields)[]

// unordered
export const durationInternalNames = [...durationFieldNames, 'sign'] as
  (keyof DurationInternals)[]

// Defaults
// -------------------------------------------------------------------------------------------------

export const durationFieldDefaults = mapPropNamesToConstant(durationFieldNames, 0)

export const durationTimeFieldDefaults = mapPropNamesToConstant(durationTimeFieldNamesAsc, 0)

// Refiners
// -------------------------------------------------------------------------------------------------

export const durationFieldRefiners = mapPropNamesToConstant(durationFieldNames, toIntegerStrict)

// Field <-> Field Conversion
// -------------------------------------------------------------------------------------------------

export function refineDurationFields(
  rawFields: DurationFields,
): DurationInternals {
  return updateDurationFieldsSign(
    mapProps(toIntegerStrict, rawFields),
  )
}

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

// Field Math
// -------------------------------------------------------------------------------------------------

/*
Mutates `fields`
TODO: crazy-overused
*/
export function updateDurationFieldsSign(fields: DurationFields): DurationInternals {
  (fields as DurationInternals).sign = computeDurationFieldsSign(fields)
  return (fields as DurationInternals)
}

export function addDayTimeDurationFields(
  a: DurationFields,
  b: DurationFields,
  sign: NumSign,
  largestUnit: DayTimeUnit
): DurationFields {
  const dayTimeNano0 = durationFieldsToDayTimeNano(a, Unit.Day)
  const dayTimeNano1 = durationFieldsToDayTimeNano(b, Unit.Day)
  const combined = addDayTimeNanos(dayTimeNano0, dayTimeNano1, sign)

  if (!Number.isFinite(combined[0])) {
    throw new RangeError('Too much')
  }

  return {
    ...durationFieldDefaults,
    ...nanoToDurationDayTimeFields(combined, largestUnit)
  }
}

export function negateDurationInternals(internals: DurationInternals): DurationInternals {
  const res = negateDurationFields(internals)
  ;(res as DurationInternals).sign = (-internals.sign || 0) as NumSign
  return (res as DurationInternals)
}

export function negateDurationFields(fields: DurationFields): DurationFields {
  const res = {} as DurationFields

  for (const fieldName of durationFieldNames) {
    res[fieldName] = fields[fieldName] * -1 || 0
  }

  return res
}

export function absDurationInternals(internals: DurationInternals): DurationInternals {
  if (internals.sign === -1) {
    return negateDurationInternals(internals)
  }
  return internals
}

export function durationHasDateParts(fields: DurationFields): boolean {
  return Boolean(computeDurationFieldsSign(fields, durationDateFieldNamesAsc))
}

function computeDurationFieldsSign(
  fields: DurationFields,
  fieldNames = durationFieldNames,
): NumSign {
  let sign: NumSign = 0

  for (const fieldName of fieldNames) {
    const fieldSign = Math.sign(fields[fieldName]) as NumSign

    if (fieldSign) {
      if (sign && sign !== fieldSign) {
        throw new RangeError('Cant have mixed signs')
      }
      sign = fieldSign
    }
  }

  return sign
}
