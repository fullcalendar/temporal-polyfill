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
  EpochSlots,
  ZonedEpochSlots,
  extractEpochNano,
} from './slots'
import { checkIsoDateTimeInBounds, isoDateTimeToEpochNano } from './timeMath'
import { queryTimeZone } from './timeZoneImpl'
import { Unit } from './units'
import { Callable, bindArgs } from './utils'

// the relative-to "origin"
export type RelativeToSlots = AbstractDateSlots | ZonedEpochSlots

// the relative-to "origin", returned from bag refining
export type RelativeToSlotsNoCalendar = CalendarDateFields | EpochAndZoneSlots

// Individual Op types
// -----------------------------------------------------------------------------

export type MarkerToEpochNano = (marker: MovableMarker) => BigNano

export type MoveMarker = (
  marker: MovableMarker,
  durationFields: DurationFields,
) => MovableMarker

export type DiffMarkers = (
  marker0: MovableMarker,
  marker1: MovableMarker,
  largestUnit: Unit,
) => DurationFields

// Marker Systems
// -----------------------------------------------------------------------------

// See comments for `createMarkerMoveOps`
export type MovableMarker =
  | CalendarDateFields
  | CalendarDateTimeFields
  | EpochSlots
export interface MarkerMoveOps {
  marker: MovableMarker
  markerToEpochNano: MarkerToEpochNano
  moveMarker: MoveMarker
}

// See comments for `createMarkerSpanOps`
export type SpannableMarker = CalendarDateTimeFields | EpochSlots
export interface MarkerSpanOps extends MarkerMoveOps {
  marker: SpannableMarker
  diffMarkers: DiffMarkers
}

// Only ever given to roundRelativeDuration after diffing (aka until/since)
// which uses it to create rounding "windows" for nudging and bubbling
// Just compares other EpochNano values to the start/end of the window
// The `marker` is the starting-point of the until/since,
// so an already-resolved ZonedDateTime, PlainDateTime, or DateLike slots
export function createMarkerMoveOps(
  marker: MovableMarker,
  markerToEpochNano: MarkerToEpochNano,
  moveMarker: MoveMarker,
): MarkerMoveOps {
  return { marker, markerToEpochNano, moveMarker }
}

// Only ever used within roundDuration and totalDuration,
// where a "window" is created (just like MarkerMoveOps), but then the start/end
// of that window is diffed to produce a Duration, for "balancing"
// The lone `relativeToSlots` argument always comes from a .relativeTo option,
// which for the classApi comes from `refinePublicRelativeTo()`
export function createMarkerSpanOps(
  relativeToSlots: RelativeToSlots,
): MarkerSpanOps {
  const calendarId = relativeToSlots.calendarId
  const calendar = getInternalCalendar(calendarId)

  if (isZonedEpochSlots(relativeToSlots)) {
    const timeZoneImpl = queryTimeZone(relativeToSlots.timeZoneId)

    return {
      marker: relativeToSlots,
      markerToEpochNano: extractEpochNano as MarkerToEpochNano,
      moveMarker: bindArgs(moveZonedEpochs, timeZoneImpl, calendar) as Callable,
      diffMarkers: bindArgs(
        diffZonedEpochsExact,
        timeZoneImpl,
        calendar,
      ) as Callable,
    }
  }

  const marker = createPlainDateTimeMarker(relativeToSlots as AbstractDateSlots)

  return {
    marker,
    markerToEpochNano: isoMarkerToEpochNano as MarkerToEpochNano,
    moveMarker: bindArgs(moveDateTime, calendar) as Callable,
    diffMarkers: bindArgs(diffDateTimesExact, calendar) as Callable,
  }
}

// Utils
// -----------------------------------------------------------------------------

// NOTE: bad name. it moves the marker and RETURNS the epoch-nanoseconds
export function moveMarkerToEpochNano(
  markerMath: MarkerMoveOps,
  durationFields: DurationFields,
): BigNano {
  return markerMath.markerToEpochNano(
    markerMath.moveMarker(markerMath.marker, durationFields),
  )
}

export function isZonedEpochSlots(
  marker: RelativeToSlots | undefined,
): marker is ZonedEpochSlots
export function isZonedEpochSlots(
  marker: MovableMarker | undefined,
): marker is EpochSlots
export function isZonedEpochSlots(
  marker: MovableMarker | RelativeToSlots | undefined,
): marker is EpochSlots | ZonedEpochSlots
export function isZonedEpochSlots(
  marker: MovableMarker | RelativeToSlots | undefined,
): boolean {
  return (marker &&
    (marker as EpochSlots).epochNanoseconds) as unknown as boolean
}

function createPlainDateTimeMarker(
  relativeToSlots: AbstractDateSlots,
): CalendarDateTimeFields {
  return combineDateAndTime(
    relativeToSlots,
    'hour' in relativeToSlots
      ? (relativeToSlots as unknown as CalendarDateTimeFields)
      : timeFieldDefaults,
  )
}

export function isoMarkerToEpochNano(marker: MovableMarker): BigNano {
  if (!isZonedEpochSlots(marker)) {
    return isoDateTimeToEpochNano(
      combineDateAndTime(marker, 'hour' in marker ? marker : timeFieldDefaults),
    )!
  }
  return marker.epochNanoseconds
}

export function checkRelativeMarkersInBounds(
  relativeMath: MarkerSpanOps,
  endMarker: MovableMarker,
): void {
  // Zoned math is already bounded by Instant conversion. Plain relative math
  // must explicitly validate the origin and destination as ISO date-times.
  if (!isZonedEpochSlots(relativeMath.marker)) {
    checkIsoMarkerInBounds(
      relativeMath.marker as CalendarDateFields | CalendarDateTimeFields,
    )
    checkIsoMarkerInBounds(
      endMarker as CalendarDateFields | CalendarDateTimeFields,
    )
  }
}

function checkIsoMarkerInBounds(
  marker: CalendarDateFields | CalendarDateTimeFields,
): void {
  checkIsoDateTimeInBounds(
    combineDateAndTime(marker, 'hour' in marker ? marker : timeFieldDefaults),
  )
}

/*
For PlainDate(Time) markers, days+time are uniform
For ZonedDateTime markers, only time is uniform (days can vary in length)
*/
export function isUniformUnit(
  unit: Unit,
  marker: MovableMarker | RelativeToSlots | undefined,
): boolean {
  return unit <= Unit.Day - (isZonedEpochSlots(marker) ? 1 : 0)
}
