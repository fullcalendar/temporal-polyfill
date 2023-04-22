import { toIntegerWithoutRounding } from './cast'
import { mapRefiners } from './convert'
import { isoTimeFieldDefaults, isoTimeFieldNames } from './isoFields'
import { remapProps } from './obj'

const durationDateFieldRefiners = {
  // sorted alphabetically
  days: toIntegerWithoutRounding,
  months: toIntegerWithoutRounding,
  weeks: toIntegerWithoutRounding,
  years: toIntegerWithoutRounding,
  // does not have 'sign'
}

const durationTimeFieldRefiners = {
  // sorted alphabetically
  hours: toIntegerWithoutRounding,
  microseconds: toIntegerWithoutRounding,
  milliseconds: toIntegerWithoutRounding,
  minutes: toIntegerWithoutRounding,
  nanoseconds: toIntegerWithoutRounding,
  seconds: toIntegerWithoutRounding,
}

export const durationFieldRefiners = { // does not include 'sign'
  // keys must be resorted
  ...durationDateFieldRefiners,
  ...durationTimeFieldRefiners,
}

export const durationDateFieldNames = Object.keys(durationDateFieldRefiners)
export const durationTimeFieldNames = Object.keys(durationTimeFieldRefiners)
export const durationFieldNames = Object.keys(durationFieldRefiners).sort()

export const durationTimeFieldDefaults = remapProps(
  isoTimeFieldDefaults,
  isoTimeFieldNames,
  durationTimeFieldNames,
)

export const durationFieldDefaults = { // does not include 'sign'
  years: 0,
  months: 0,
  days: 0,
  ...durationTimeFieldDefaults,
}

export const durationFieldGetters = durationFieldNames
  .concat(['sign'])
  .reduce((accum, durationFieldName, i) => {
    accum[durationFieldName] = function(internals) {
      return internals[durationFieldName]
    }
    return accum
  }, {}) // TODO: somehow leverage remapProps instead?

export function negateDurationFields(internals) {
  // recomputes sign
}

export function absolutizeDurationFields(internals) {
  // recomputes sign
}

export function durationHasDateParts(internals) {
  return Boolean(computeDurationFieldsSign(internals, durationDateFieldNames))
}

export function durationTimeFieldsToIso(durationFields0) {
  return remapProps(durationFields0, durationTimeFieldNames, isoTimeFieldNames)
}

export function refineDurationFields(input) {
  const obj = mapRefiners(input, durationFieldRefiners)
  obj.sign = computeDurationFieldsSign(obj)
  return obj
}

function computeDurationFieldsSign(internals, fieldNames = durationFieldNames) {
  // should throw error if mismatch
  // TODO: audit repeat uses of this
}
