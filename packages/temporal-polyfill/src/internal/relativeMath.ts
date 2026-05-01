import { BigNano } from './bigNano'
import { diffDateTimesExact, diffZonedEpochsExact } from './diff'
import { DurationFields } from './durationFields'
import { timeFieldDefaults } from './fieldNames'
import { IsoDateCarrier, IsoDateTimeCarrier } from './isoFields'
import { moveDateTime, moveZonedEpochs } from './move'
import {
  AbstractDateSlots,
  EpochAndZoneSlots,
  ZonedEpochSlots,
  extractEpochNano,
} from './slots'
import { isoDateAndTimeToEpochNano } from './timeMath'
import { TimeZoneImpl, queryTimeZone } from './timeZoneImpl'
import { Unit } from './units'
import { Callable, bindArgs } from './utils'

// the relative-to "origin"
export type RelativeToSlots = AbstractDateSlots | ZonedEpochSlots

// the relative-to "origin", returned from bag refining
export type RelativeToSlotsNoCalendar = IsoDateCarrier | EpochAndZoneSlots

// A date/time marker that can be moved away from the relative-to origin and
// then compared back against it. Zoned markers keep epoch nanoseconds because
// their day lengths are time-zone dependent.
export type Marker = IsoDateCarrier | IsoDateTimeCarrier | ZonedEpochSlots

export type RelativeOrigin = [marker: Marker, timeZoneImpl?: TimeZoneImpl]

export function createRelativeOrigin(
  relativeToSlots: RelativeToSlots,
): RelativeOrigin {
  if (isZonedEpochSlots(relativeToSlots)) {
    return [relativeToSlots, queryTimeZone(relativeToSlots.timeZone)]
  }

  return [
    {
      isoDate: relativeToSlots.isoDate,
      time:
        'time' in relativeToSlots
          ? (relativeToSlots as IsoDateTimeCarrier).time
          : timeFieldDefaults,
    },
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
  return (
    timeZoneImpl ? extractEpochNano : isoMarkerToEpochNano
  ) as MarkerToEpochNano
}

export function createMoveMarker(
  timeZoneImpl: TimeZoneImpl | undefined,
  calendarId: string,
): MoveMarker {
  if (timeZoneImpl) {
    return bindArgs(moveZonedEpochs, timeZoneImpl, calendarId) as Callable
  }
  return bindArgs(moveDateTimeMarker, calendarId) as Callable
}

export function createDiffMarkers(
  timeZoneImpl: TimeZoneImpl | undefined,
  calendarId: string,
): DiffMarkers {
  if (timeZoneImpl) {
    return bindArgs(diffZonedEpochsExact, timeZoneImpl, calendarId) as Callable
  }
  return bindArgs(diffDateTimeMarkersExact, calendarId) as Callable
}

// Utils
// -----------------------------------------------------------------------------

export function isZonedEpochSlots(
  marker: Marker | RelativeToSlots | undefined,
): marker is ZonedEpochSlots {
  return (marker &&
    (marker as ZonedEpochSlots).epochNanoseconds) as unknown as boolean
}

function moveDateTimeMarker(
  calendarId: string,
  isoDateTime: IsoDateTimeCarrier,
  durationFields: DurationFields,
): IsoDateTimeCarrier {
  return moveDateTime(
    calendarId,
    isoDateTime.isoDate,
    isoDateTime.time,
    durationFields,
  )
}

export function isoMarkerToEpochNano(marker: Marker): BigNano {
  if ('isoDate' in marker) {
    return isoDateAndTimeToEpochNano(
      marker.isoDate,
      'time' in marker
        ? (marker as IsoDateTimeCarrier).time
        : timeFieldDefaults,
    )!
  }
  return marker.epochNanoseconds
}

function diffDateTimeMarkersExact(
  calendarId: string,
  startIsoDateTime: IsoDateTimeCarrier,
  endIsoDateTime: IsoDateTimeCarrier,
  largestUnit: Unit,
): DurationFields {
  return diffDateTimesExact(
    calendarId,
    startIsoDateTime.isoDate,
    startIsoDateTime.time,
    endIsoDateTime.isoDate,
    endIsoDateTime.time,
    largestUnit,
  )
}

/*
For PlainDate(Time) markers, days+time are uniform
For ZonedDateTime markers, only time is uniform (days can vary in length)
*/
export function isUniformUnit(
  unit: Unit,
  marker: Marker | RelativeToSlots | undefined,
): boolean {
  return unit <= Unit.Day - (isZonedEpochSlots(marker) ? 1 : 0)
}
