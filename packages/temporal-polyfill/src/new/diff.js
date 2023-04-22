import { addDaysToIsoFields, pluckIsoTimeFields } from './isoFields'
import { compareLargeInts } from './largeInt'
import { nanosecondsInDay } from './nanoseconds'

// Diffing & Rounding
// -------------------------------------------------------------------------------------------------

export function diffEpochNanoseconds(
  startEpochNanoseconds,
  endEpochNanoseconds,
  largestUnit,
  smallestUnit,
  roundingMode,
  roundingIncrement,
) {
  return diffExactLargeNanoseconds(
    roundLargeNanoseconds(
      endEpochNanoseconds.subtract(startEpochNanoseconds),
      smallestUnit,
      roundingMode,
      roundingIncrement,
    ),
    largestUnit,
  )
}

export function diffZoneEpochNanoseconds(
  startEpochNanoseconds,
  endEpochNanoseconds,
  timeZone,
  calendar,
  largestUnit,
  smallestUnit,
  roundingMode,
  roundingIncrement,
) {
  if (smallestUnit < 'day') { // TODO
    return diffEpochNanoseconds(
      startEpochNanoseconds,
      endEpochNanoseconds,
      largestUnit,
      smallestUnit,
      roundingMode,
      roundingIncrement,
    )
  }

  function isoToZoneEpochNanoseconds(isoFields) {
    return isoToEpochNanoseconds(isoFields, timeZone)
  }

  const sign = compareLargeInts(startEpochNanoseconds, endEpochNanoseconds)
  const startIsoFields = epochNanosecondsToIso(startEpochNanoseconds, timeZone)
  const startIsoTimeFields = pluckIsoTimeFields(startIsoFields)
  const endIsoFields = epochNanosecondsToIso(endEpochNanoseconds, timeZone)
  let midIsoFields = { ...endIsoFields, ...startIsoTimeFields }
  let midEpochNanoseconds = isoToZoneEpochNanoseconds(midIsoFields)
  const midSign = compareLargeInts(midEpochNanoseconds, endEpochNanoseconds)

  if (midSign === -sign) {
    midIsoFields = {
      ...addDaysToIsoFields(endIsoFields, -sign),
      ...startIsoTimeFields,
    }
    midEpochNanoseconds = isoToZoneEpochNanoseconds(midIsoFields)
  }

  const dateDiff = diffExactDates(
    startIsoFields,
    midIsoFields,
    calendar,
    largestUnit,
  )
  const timeDiff = diffExactLargeNanoseconds(
    endEpochNanoseconds.subtract(midEpochNanoseconds),
    'hours', // largestUnit (default?)
  )

  return roundRelativeDuration(
    { ...dateDiff, ...timeDiff, sign },
    startIsoFields,
    startEpochNanoseconds,
    endIsoFields,
    endEpochNanoseconds,
    isoToZoneEpochNanoseconds,
    calendar,
    largestUnit,
    smallestUnit,
    roundingMode,
    roundingIncrement,
  )
}

export function diffDateTimes(
  startIsoFields,
  endIsoFields,
  calendar,
  largestUnit,
  smallestUnit,
  roundingMode,
  roundingIncrement,
) {
  const startEpochNanoseconds = isoToUtcEpochNanoseconds(startIsoFields)
  const endEpochNanoseconds = isoToUtcEpochNanoseconds(endIsoFields)

  if (smallestUnit < 'day') { // TODO
    return diffEpochNanoseconds(
      startEpochNanoseconds,
      endEpochNanoseconds,
      largestUnit,
      smallestUnit,
      roundingMode,
      roundingIncrement,
    )
  }

  const sign = compareLargeInts(startEpochNanoseconds, endEpochNanoseconds)
  const startTimeNanoseconds = isoTimeToNanoseconds(startIsoFields) // number
  const endTimeNanoseconds = isoTimeToNanoseconds(endIsoFields) // number
  let timeNanosecondDiff = endTimeNanoseconds - startTimeNanoseconds
  const timeSign = numberSign(timeNanosecondDiff)
  let midIsoFields = startIsoFields

  if (timeSign === -sign) {
    midIsoFields = {
      ...addDaysToIsoFields(startIsoFields, sign),
      ...pluckIsoTimeFields(startIsoFields),
    }
    timeNanosecondDiff += nanosecondsInDay
  }

  const dateDiff = diffExactDates(
    midIsoFields,
    endIsoFields,
    calendar,
    largestUnit,
  )
  const timeDiff = nanosecondsToTimeDuration(
    timeNanosecondDiff,
    'hours', // largestUnit (default?)
  )

  return roundRelativeDuration(
    { ...dateDiff, ...timeDiff, sign },
    startIsoFields,
    startEpochNanoseconds,
    endIsoFields,
    endEpochNanoseconds,
    isoToUtcEpochNanoseconds,
    calendar,
    largestUnit,
    smallestUnit,
    roundingMode,
    roundingIncrement,
  )
}

export function diffDates(
  startIsoDateFields,
  endIsoDateFields,
  calendar,
  largestUnit,
  smallestUnit,
  roundingMode,
  roundingIncrement,
) {
  const startEpochNanoseconds = isoToUtcEpochNanoseconds(startIsoDateFields)
  const endEpochNanoseconds = isoToUtcEpochNanoseconds(endIsoDateFields)

  if (smallestUnit < 'day') { // TODO
    return diffEpochNanoseconds(
      startEpochNanoseconds,
      endEpochNanoseconds,
      largestUnit,
      smallestUnit,
      roundingMode,
      roundingIncrement,
    )
  }

  const dateDiff = diffExactDates(
    startIsoDateFields,
    endIsoDateFields,
    calendar,
    largestUnit,
  )

  return roundRelativeDuration(
    dateDiff,
    startIsoDateFields,
    startEpochNanoseconds,
    endIsoDateFields,
    endEpochNanoseconds,
    isoToUtcEpochNanoseconds,
    calendar,
    largestUnit,
    smallestUnit,
    roundingMode,
    roundingIncrement,
  )
}

export function diffTimes() {

}

// Public Duration Stuff
// -------------------------------------------------------------------------------------------------

export function roundDuration(
  durationFields,
  largestUnit,
  smallestUnit,
  roundingMode,
  roundingIncrement,
  relativeTo,
) {

}

export function computeDurationTotal(
  durationFields,
  unit,
  relativeTo,
) {

}

// Exact Diffing
// -------------------------------------------------------------------------------------------------

function diffExactDates(
  startIsoDateFields,
  endIsoDateFields,
  calendar,
  largestUnit,
) {
  // defers to CalendarProtocol
}

function diffExactLargeNanoseconds(
  nanoseconds,
  largestUnit,
) {

}

// Rounding
// -------------------------------------------------------------------------------------------------

function roundRelativeDuration(
  durationFields,
  startIsoFields,
  startEpochNanoseconds,
  endIsoFields,
  endEpochNanoseconds,
  isoToZoneEpochNanoseconds,
  calendar,
  largestUnit,
  smallestUnit,
  roundingMode,
  roundingIncrement,
) {
  // TOOO: figure out edge case where time fields round up past end of zoned day,
  // and then must be rerounded with the next day's reference frame
}

function roundLargeNanoseconds(
  nanoseconds,
  smallestUnit,
  roundingMode,
  roundingIncrement,
) {

}

// Epoch/Time
// -------------------------------------------------------------------------------------------------

function isoToUtcEpochNanoseconds(isoFields) {

}

function isoTimeToNanoseconds(isoTimeFields) {

}

function nanosecondsToTimeDuration(nanoseconds) { // nanoseconds is a number

}

// TimeZone Conversions
// -------------------------------------------------------------------------------------------------

function epochNanosecondsToIso(epochNanoseconds, timeZone) {

}

function isoToEpochNanoseconds(isoFields, timeZone, disambig) {
  return isoToPossibleEpochNanoseconds(isoFields, timeZone)[0] // example
}

function isoToPossibleEpochNanoseconds(isoFields, timeZone) {

}

// Random Utils
// -------------------------------------------------------------------------------------------------

function numberSign(number) {

}
