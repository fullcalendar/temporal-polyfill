import { strictArrayOfType, toInteger } from './cast'
import { Instant, createInstant } from './instant'
import { nanosecondsInDay } from './nanoseconds'
import { getInternals } from './temporalClass'

// High-level usage with Temporal objects
// -------------------------------------------------------------------------------------------------

export function zonedDateTimeInternalsToOffsetNanoseconds(internals) {
  return instantToOffsetNanoseconds(internals.timeZone, createInstant(internals.epochNanoseconds))
}

export function computeIsoFieldEpochNanoseconds(
  isoFields, // should accept PlainDateTime instead?
  timeZoneProtocol,
  offset,
  z,
  offsetHandling, // 'reject'
  disambig, // 'compatible'
  fuzzy,
) {
  // relies on plainDateTimeToPossibleInstants
}

export function computeNanosecondsInDay(isoFields, timeZoneProtocol) {
  // relies on plainDateTimeToPossibleInstants
}

// Utils for Calendar and users of CalendarProtocol
// -------------------------------------------------------------------------------------------------

export function instantToPlainDateTimeInternals(timeZoneProtocol, calendar, instant) {
  return getInternals(instantToPlainDateTime(timeZoneProtocol, calendar, instant))
}

export function instantToPlainDateTime(timeZoneProtocol, calendar, instant) {
  // relies on instantToOffsetNanoseconds
}

export function plainDateTimeToEpochNanoseconds(timeZoneProtocol, plainDateTime, disambiguation) {
  return getInternals(plainDateTimeToInstant(timeZoneProtocol, plainDateTime, disambiguation))
}

function plainDateTimeToInstant(timeZoneProtocol, plainDateTime, disambiguation) {
  // relies on plainDateTimeToPossibleInstants
}

// Only raw CalendarProtocol methods that can be relied upon
// -------------------------------------------------------------------------------------------------

export function instantToOffsetNanoseconds(timeZoneProtocol, instant) {
  const nanoseconds = toInteger(timeZoneProtocol.getOffsetNanosecondsFor(instant))

  if (Math.abs(nanoseconds) >= nanosecondsInDay) {
    throw new RangeError('out of range')
  }

  return nanoseconds
}

export function plainDateTimeToPossibleInstants(timeZoneProtocol, plainDateTime) {
  return strictArrayOfType(timeZoneProtocol.getPossibleInstantsFor(plainDateTime), Instant)
}

// Utils
// -------------------------------------------------------------------------------------------------

export function getCommonTimeZone() {
}

export function toTimeZoneSlot() {

}
