import { isoTimeFieldNames } from './isoFields'
import { toIntegerStrict } from './options'
import {
  dayIndex,
  givenFieldsToLargeNano,
  hourIndex,
  nanoToGivenFields,
  unitIndexToNano,
  unitNamesAsc,
} from './units'
import {
  mapPropNames,
  mapPropNamesToConstant,
  mapPropNamesToIndex,
  mapPropsWithRefiners,
  remapProps,
} from './utils'

// Property Names
// -------------------------------------------------------------------------------------------------

export const durationFieldNamesAsc = unitNamesAsc.map((unitName) => unitName + 's') // pluralize
export const durationFieldIndexes = mapPropNamesToIndex(durationFieldNamesAsc)
export const durationFieldNames = durationFieldNamesAsc.sort()

// unordered
const durationTimeFieldNames = durationFieldNamesAsc.slice(0, dayIndex)
const durationDateFieldNames = durationFieldNamesAsc.slice(dayIndex)
const durationInternalNames = [...durationFieldNames, 'sign']

// Defaults
// -------------------------------------------------------------------------------------------------

export const durationFieldDefaults = mapPropNamesToConstant(durationFieldNames, 0)
export const durationTimeFieldDefaults = mapPropNamesToConstant(durationTimeFieldNames, 0)

// Refiners
// -------------------------------------------------------------------------------------------------

export const durationFieldRefiners = mapPropNamesToConstant(durationFieldNames, toIntegerStrict)

// Getters
// -------------------------------------------------------------------------------------------------

export const durationGetters = mapPropNames((propName) => {
  return (durationInternals) => {
    return durationInternals[propName]
  }
}, durationInternalNames)

// Field <-> Field Conversion
// -------------------------------------------------------------------------------------------------

export function refineDurationInternals(rawDurationFields) {
  return updateDurationFieldsSign(mapPropsWithRefiners(rawDurationFields, durationFieldRefiners))
}

export const durationTimeFieldsToIso = remapProps.bind(
  undefined,
  durationTimeFieldNames,
  isoTimeFieldNames,
)

export function durationTimeFieldsToIsoStrict(durationFields) {
  if (durationHasDateParts(durationFields)) {
    throw new RangeError('Operation not allowed')
  }
  return durationTimeFieldsToIso(durationFields)
}

// Field <-> Nanosecond Conversion
// -------------------------------------------------------------------------------------------------

export function durationFieldsToNano(durationFields, largestUnitIndex = dayIndex) {
  return givenFieldsToLargeNano(durationFields, largestUnitIndex, durationFieldNamesAsc)
}

export function durationFieldsToTimeNano(durationFields) {
  return durationFieldsToNano(durationFields, hourIndex).toNumber()
}

export function nanoToDurationFields(largeNano, largestUnitIndex = dayIndex) {
  const divisor = unitIndexToNano[largestUnitIndex]
  const [largeUnitNum, remainder] = largeNano.divTruncMod(divisor)

  return {
    [durationFieldNamesAsc[largestUnitIndex]]: largeUnitNum.toNumber(),
    ...nanoToGivenFields(remainder, largestUnitIndex - 1, durationFieldNamesAsc),
  }
}

export function timeNanoToDurationFields(nano) {
  return nanoToGivenFields(nano, hourIndex, durationFieldNamesAsc)
}

// Field Math
// -------------------------------------------------------------------------------------------------

export function updateDurationFieldsSign(fields) {
  fields.sign = computeDurationFieldsSign(fields)
  return fields // returns 'internals'
}

export function addDurationFields(a, b, sign) { // TODO: make version that updates sign?
  const res = {}

  for (const fieldName in durationFieldNames) {
    res[fieldName] = a[fieldName] + b[fieldName] * sign
  }

  return res
}

export function negateDurationInternals(internals) {
  const res = {}

  for (const fieldName in durationFieldNames) {
    res[fieldName] = internals[fieldName] * -1 || 0
  }

  res.sign = -internals.sign || 0
  return res
}

export function absDurationInternals(internals) {
  if (internals.sign === -1) {
    return negateDurationInternals(internals)
  }
  return internals
}

export function durationHasDateParts(internals) {
  return Boolean(computeDurationFieldsSign(internals, durationDateFieldNames))
}

function computeDurationFieldsSign(internals, fieldNames = durationFieldNames) {
  let sign = 0

  for (const fieldName in durationFieldNames) {
    const fieldSign = Math.sign(internals[fieldName])

    if (fieldSign) {
      if (sign && sign !== fieldSign) {
        throw new RangeError('Cant have mixed signs')
      }
      sign = fieldSign
    }
  }

  return sign
}
