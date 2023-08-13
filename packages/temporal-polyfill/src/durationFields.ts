import { LargeInt, numberToLargeInt } from './largeInt'
import { toIntegerStrict } from './cast'
import {
  DayTimeUnit,
  TimeUnit,
  Unit,
  balanceUpTimeFields,
  givenFieldsToNano,
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
const durationInternalNames = [...durationFieldNames, 'sign'] as
  (keyof DurationInternals)[]

// Defaults
// -------------------------------------------------------------------------------------------------

export const durationFieldDefaults = mapPropNamesToConstant(durationFieldNames, 0)

export const durationTimeFieldDefaults = mapPropNamesToConstant(durationTimeFieldNamesAsc, 0)

// Refiners
// -------------------------------------------------------------------------------------------------

export const durationFieldRefiners = mapPropNamesToConstant(durationFieldNames, toIntegerStrict)

// Getters
// -------------------------------------------------------------------------------------------------

export const durationInternalGetters = mapPropNames((propName: keyof DurationInternals) => {
  return (internals: DurationInternals) => {
    return internals[propName]
  }
}, durationInternalNames)

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

export function durationTimeFieldsToLargeNanoStrict(fields: DurationFields): LargeInt {
  if (durationHasDateParts(fields)) {
    throw new RangeError('Operation not allowed') // correct error?
  }

  return durationFieldsToNano(fields, Unit.Hour)
}

export function durationFieldsToNano(fields: DurationFields, largestUnit: DayTimeUnit): LargeInt {
  const balancedFields = balanceUpTimeFields(fields, largestUnit, durationFieldNamesAsc)

  return numberToLargeInt(nanoInUtcDay).mult(balancedFields.days)
    .addNumber(givenFieldsToNano(balancedFields, largestUnit, durationFieldNamesAsc))
}

export function durationFieldsToTimeOfDayNano(fields: DurationFields): number {
  const balancedFields = balanceUpTimeFields(fields, Unit.Day, durationFieldNamesAsc)

  return givenFieldsToNano(balancedFields, Unit.Hour, durationFieldNamesAsc)
}

export function nanoToDurationFields(
  largeNano: LargeInt,
  largestUnit: DayTimeUnit = Unit.Day,
): DurationFields {
  const divisor = unitNanoMap[largestUnit]
  const [largeUnitNum, remainder] = largeNano.divModTrunc(divisor)

  return {
    ...durationFieldDefaults,
    [durationFieldNamesAsc[largestUnit]]: largeUnitNum.toNumber(),
    ...nanoToGivenFields(remainder, largestUnit - 1, durationFieldNamesAsc),
  }
}

export function timeNanoToDurationFields(
  nano: number,
  largestUnit: TimeUnit = Unit.Hour,
): DurationFields {
  return {
    ...durationFieldDefaults, // TODO: make nanoToGivenFields do this?
    ...nanoToGivenFields(
      nano,
      largestUnit,
      durationFieldNamesAsc,
    )
  }
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

export function addDurationFields(
  a: DurationFields,
  b: DurationFields,
  sign: NumSign,
): DurationFields {
  const res = {} as DurationFields

  for (const fieldName of durationFieldNames) {
    res[fieldName] = a[fieldName] + b[fieldName] * sign
  }

  return res
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
