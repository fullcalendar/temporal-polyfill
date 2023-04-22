import { isTimeUnit, toSmallestUnit } from './options'

/*
(RoundDuration)
Only has smallestUnit
Options includes relativeTo
should work for ANY smallestUnit

does NOT do balancing, because caller might want a specific type of balancing
*/
export function roundDurationInternals(durationInternals, options) {

}

/*
NOTE: Duration should call this if relativeTo is a ZonedDateTime
*/
export function adjustDurationFieldsForTimeZone(
  durationInternals,
  zonedDateTime,
  options, // { roundingIncrement, smallestUnit, roundingMode }
) {
  // AdjustRoundedDurationDays

  const smallestUnit = toSmallestUnit(options)

  // short-circuit if time-rounding won't happen
  if (
    !isTimeUnit(smallestUnit) ||
    (smallestUnit === 'nanosecond' && options.roundingIncrement === 1)
  ) {
    return durationInternals
  }
}

function getNanosecondsInNormalDay() {
  return 86400e9
}

export function roundIsoDateTimeFields(
  isoFields,
  options,
  getNanosecondsInDay = getNanosecondsInNormalDay,
) {
  const isoTimeFields = roundIsoTimeFields(isoFields, options, getNanosecondsInDay)
  return combineThem(isoFields, isoTimeFields)
}

export function roundIsoTimeFields(
  isoTimeFields,
  options,
  getNanosecondsInDay = getNanosecondsInNormalDay,
) {
  // returns isoTimeFields back
}

function combineThem(isoDateFields, isoTimeFields) {
  // uses 'day' field as delta. will rebalance date (using iso util)
}

export function roundEpochNanoseconds(epochNanoseconds, options) {

}
