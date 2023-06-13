import { isoTimeFieldNames } from './isoFields'
import {
  arbitraryFieldsToLargeNano,
  hourIndex,
  nanoInUnit,
  nanoToArbitraryFields,
  unitIndexes,
} from './isoMath'
import { toIntegerWithoutRounding } from './options'
import { mapArrayToProps, mapRefiners, remapProps, zipSingleValue } from './util'

// Refiners
// -------------------------------------------------------------------------------------------------

// Ordered by ascending size
const durationTimeFieldRefiners = {
  nanoseconds: toIntegerWithoutRounding,
  microseconds: toIntegerWithoutRounding,
  milliseconds: toIntegerWithoutRounding,
  seconds: toIntegerWithoutRounding,
  minutes: toIntegerWithoutRounding,
  hours: toIntegerWithoutRounding,
}

// Ordered by ascending size
const durationDateFieldRefiners = {
  days: toIntegerWithoutRounding,
  months: toIntegerWithoutRounding,
  weeks: toIntegerWithoutRounding,
  years: toIntegerWithoutRounding,
}

// Ordered by ascending size
export const durationFieldRefiners = {
  ...durationTimeFieldRefiners,
  ...durationDateFieldRefiners,
}

// Property Names
// -------------------------------------------------------------------------------------------------

const durationDateFieldNames = Object.keys(durationDateFieldRefiners).sort()
const durationTimeFieldNames = Object.keys(durationTimeFieldRefiners).sort()
export const durationFieldNamesAsc = Object.keys(durationFieldRefiners)
export const durationFieldNames = durationFieldNamesAsc.sort()
const durationInternalNames = [...durationFieldNames, 'sign'] // unordered

// Getters
// -------------------------------------------------------------------------------------------------

export const durationGetters = mapArrayToProps(durationInternalNames, (propName) => {
  return (durationInternals) => {
    return durationInternals[propName]
  }
})

// Defaults
// -------------------------------------------------------------------------------------------------

const durationDateFieldDefaults = zipSingleValue(durationDateFieldNames, 0)
export const durationTimeFieldDefaults = zipSingleValue(durationTimeFieldNames, 0)
export const durationFieldDefaults = {
  ...durationDateFieldDefaults,
  ...durationTimeFieldDefaults,
}

// Refining / Conversion
// -------------------------------------------------------------------------------------------------

export function refineDurationInternals(rawDurationFields) {
  return updateDurationFieldsSign(mapRefiners(rawDurationFields, durationFieldRefiners))
}

export function updateDurationFieldsSign(fields) {
  fields.sign = computeDurationFieldsSign(fields)
  return fields
}

export function durationTimeFieldsToIso(durationTimeFields) {
  return remapProps(durationTimeFields, durationTimeFieldNames, isoTimeFieldNames)
}

// Field Math
// -------------------------------------------------------------------------------------------------

export function addDurationFields(durationFields0, durationFields1, sign) {
  // recomputes sign
}

export function negateDurationFields(internals) {
  // recomputes sign
}

export function absolutizeDurationFields(internals) {
  // recomputes sign
}

export function durationHasDateParts(internals) {
  return Boolean(computeDurationFieldsSign(internals, durationDateFieldNames))
}

function computeDurationFieldsSign(internals, fieldNames = durationFieldNames) {
  // should throw error if mismatch
  // TODO: audit repeat uses of this
}

// Nano Math
// -------------------------------------------------------------------------------------------------

export function durationFieldsToNano(durationFields, largestUnit = 'day') {
  return arbitraryFieldsToLargeNano(durationFields, unitIndexes[largestUnit], durationFieldNamesAsc)
}

export function durationFieldsToTimeNano(durationFields) {
  return arbitraryFieldsToLargeNano(durationFields, hourIndex, durationFieldNamesAsc).toNumber()
}

export function nanoToDurationFields(largeNano, largestUnit = 'day') {
  const divisor = nanoInUnit[largestUnit]
  const [largeUnitNum, remainder] = largeNano.divModTrunc(divisor)

  return {
    ...nanoToArbitraryFields(remainder, unitIndexes[largestUnit] - 1, durationFieldNamesAsc),
    [largestUnit]: largeUnitNum.toNumber(),
  }
}

export function timeNanoToDurationFields(nano) {
  return nanoToArbitraryFields(nano, hourIndex, durationFieldNamesAsc)
}
