import { isoTimeFieldNames } from './isoFields'
import { toIntegerWithoutRounding } from './options'
import { mapArrayToProps, mapRefiners, remapProps, zipSingleValue } from './util'

// Refiners
// -------------------------------------------------------------------------------------------------

// Ordered alphabetically
const durationDateFieldRefiners = {
  days: toIntegerWithoutRounding,
  months: toIntegerWithoutRounding,
  weeks: toIntegerWithoutRounding,
  years: toIntegerWithoutRounding,
}

// Ordered alphabetically
const durationTimeFieldRefiners = {
  hours: toIntegerWithoutRounding,
  microseconds: toIntegerWithoutRounding,
  milliseconds: toIntegerWithoutRounding,
  minutes: toIntegerWithoutRounding,
  nanoseconds: toIntegerWithoutRounding,
  seconds: toIntegerWithoutRounding,
}

// Unordered
export const durationFieldRefiners = {
  ...durationDateFieldRefiners,
  ...durationTimeFieldRefiners,
}

// Property Names
// -------------------------------------------------------------------------------------------------

const durationDateFieldNames = Object.keys(durationDateFieldRefiners)
const durationTimeFieldNames = Object.keys(durationTimeFieldRefiners)
export const durationFieldNames = Object.keys(durationFieldRefiners).sort()
const durationInternalNames = [...durationFieldNames, 'sign']

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

// Math
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
