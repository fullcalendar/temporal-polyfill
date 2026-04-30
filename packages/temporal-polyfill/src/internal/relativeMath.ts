import { BigNano } from './bigNano'
import { diffDateTimesExact, diffZonedEpochsExact } from './diff'
import { DurationFields } from './durationFields'
import {
  IsoDateFields,
  IsoDateTimeFields,
  isoTimeFieldDefaults,
} from './isoFields'
import { moveDateTime, moveZonedEpochs } from './move'
import {
  AbstractDateSlots,
  EpochAndZoneSlots,
  ZonedEpochSlots,
  extractEpochNano,
} from './slots'
import { isoToEpochNano } from './timeMath'
import { TimeZoneImpl, queryTimeZone } from './timeZoneImpl'
import { Unit } from './units'
import { Callable, bindArgs } from './utils'

// the relative-to "origin"
export type RelativeToSlots = AbstractDateSlots | ZonedEpochSlots

// the relative-to "origin", returned from bag refining
export type RelativeToSlotsNoCalendar = IsoDateFields | EpochAndZoneSlots

// A date/time marker that can be moved away from the relative-to origin and
// then compared back against it. Zoned markers keep epoch nanoseconds because
// their day lengths are time-zone dependent.
export type Marker = IsoDateFields | IsoDateTimeFields | ZonedEpochSlots

export type RelativeOrigin = [marker: Marker, timeZoneImpl?: TimeZoneImpl]

export function createRelativeOrigin(
  relativeToSlots: RelativeToSlots,
): RelativeOrigin {
  if (isZonedEpochSlots(relativeToSlots)) {
    return [relativeToSlots, queryTimeZone(relativeToSlots.timeZone)]
  }

  return [
    // convert IsoDateFields->IsoDateTimeFields
    // because expected in createMoveMarker/createDiffMarkers
    { ...relativeToSlots, ...isoTimeFieldDefaults },
  ]
}

// Atomic Operations
// -----------------------------------------------------------------------------

export type MarkerToEpochNano = (marker: Marker) => BigNano

export type MoveMarker = (
  marker: Marker,
  durationFields: DurationFields,
) => Marker

export type DiffMarkers = (
  marker0: Marker,
  marker1: Marker,
  largestUnit: Unit,
) => DurationFields

export function createMarkerToEpochNano(
  timeZoneImpl: TimeZoneImpl | undefined,
): MarkerToEpochNano {
  return (timeZoneImpl ? extractEpochNano : isoToEpochNano) as MarkerToEpochNano
}

export function createMoveMarker(
  timeZoneImpl: TimeZoneImpl | undefined,
  calendarId: string,
): MoveMarker {
  if (timeZoneImpl) {
    return bindArgs(moveZonedEpochs, timeZoneImpl, calendarId) as Callable
  }
  return bindArgs(moveDateTime, calendarId) as Callable
}

export function createDiffMarkers(
  timeZoneImpl: TimeZoneImpl | undefined,
  calendarId: string,
): DiffMarkers {
  if (timeZoneImpl) {
    return bindArgs(diffZonedEpochsExact, timeZoneImpl, calendarId) as Callable
  }
  return bindArgs(diffDateTimesExact, calendarId) as Callable
}

// Utils
// -----------------------------------------------------------------------------

export function isZonedEpochSlots(
  marker: Marker | undefined,
): marker is ZonedEpochSlots {
  return (marker &&
    (marker as ZonedEpochSlots).epochNanoseconds) as unknown as boolean
}

/*
For PlainDate(Time) markers, days+time are uniform
For ZonedDateTime markers, only time is uniform (days can vary in length)
*/
export function isUniformUnit(unit: Unit, marker: Marker | undefined): boolean {
  return unit <= Unit.Day - (isZonedEpochSlots(marker) ? 1 : 0)
}
