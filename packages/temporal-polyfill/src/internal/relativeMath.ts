import { BigNano } from './bigNano'
import { diffDateTimesExact, diffZonedEpochsExact } from './diff'
import { DurationFields } from './durationFields'
import { getInternalCalendar } from './externalCalendar'
import { timeFieldDefaults } from './fieldNames'
import { CalendarDateFields, CalendarDateTimeFields } from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { moveDateTime, moveZonedEpochs } from './move'
import {
  AbstractDateSlots,
  EpochAndZoneSlots,
  ZonedEpochSlots,
  extractEpochNano,
} from './slots'
import { isoDateTimeToEpochNano } from './timeMath'
import { TimeZoneImpl, queryTimeZone } from './timeZoneImpl'
import { Unit } from './units'
import { Callable, bindArgs } from './utils'

// the relative-to "origin"
export type RelativeToSlots = AbstractDateSlots | ZonedEpochSlots

// the relative-to "origin", returned from bag refining
export type RelativeToSlotsNoCalendar = CalendarDateFields | EpochAndZoneSlots

// A date/time marker that can be moved away from the relative-to origin and
// then compared back against it. Zoned markers keep epoch nanoseconds because
// their day lengths are time-zone dependent.
export type Marker =
  | CalendarDateFields
  | CalendarDateTimeFields
  | ZonedEpochSlots

export type RelativeOrigin = [marker: Marker, timeZoneImpl?: TimeZoneImpl]

export function createRelativeOrigin(
  relativeToSlots: RelativeToSlots,
): RelativeOrigin {
  if (isZonedEpochSlots(relativeToSlots)) {
    return [relativeToSlots, queryTimeZone(relativeToSlots.timeZoneId)]
  }

  return [
    combineDateAndTime(
      relativeToSlots,
      'hour' in relativeToSlots
        ? (relativeToSlots as unknown as CalendarDateTimeFields)
        : timeFieldDefaults,
    ),
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
    return bindArgs(
      moveZonedEpochs,
      timeZoneImpl,
      getInternalCalendar(calendarId),
    ) as Callable
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
  isoDateTime: CalendarDateTimeFields,
  durationFields: DurationFields,
): CalendarDateTimeFields {
  return moveDateTime(
    getInternalCalendar(calendarId),
    isoDateTime,
    durationFields,
  )
}

export function isoMarkerToEpochNano(marker: Marker): BigNano {
  if (!isZonedEpochSlots(marker)) {
    return isoDateTimeToEpochNano(
      combineDateAndTime(marker, 'hour' in marker ? marker : timeFieldDefaults),
    )!
  }
  return marker.epochNanoseconds
}

function diffDateTimeMarkersExact(
  calendarId: string,
  startIsoDateTime: CalendarDateTimeFields,
  endIsoDateTime: CalendarDateTimeFields,
  largestUnit: Unit,
): DurationFields {
  return diffDateTimesExact(
    calendarId,
    startIsoDateTime,
    endIsoDateTime,
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
