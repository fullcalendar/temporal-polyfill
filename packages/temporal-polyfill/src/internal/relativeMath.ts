import { BigNano } from './bigNano'
import { diffDateTimesExact, diffZonedEpochsExact } from './diff'
import { DurationFields } from './durationFields'
import { timeFieldDefaults } from './fieldNames'
import { CalendarDateFields, CalendarDateTimeFields } from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { slotsWithCalendar } from './modify'
import { moveDateTime, moveZonedEpochs } from './move'
import {
  AbstractDateSlots,
  AbstractDateTimeSlots,
  EpochAndZoneSlots,
  EpochSlots,
  ZonedEpochSlots,
  extractEpochNano,
} from './slots'
import { checkIsoDateTimeInBounds, isoDateTimeToEpochNano } from './timeMath'
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
  | AbstractDateSlots
  | AbstractDateTimeSlots
  | EpochSlots
export interface MarkerMoveOps {
  marker: MovableMarker
  markerToEpochNano: MarkerToEpochNano
  moveMarker: MoveMarker
}

// See comments for `createMarkerSpanOps`
export type SpannableMarker = AbstractDateTimeSlots | EpochSlots
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
// and for the funcApi comes from `identity` (uses relativeTo slots as-is)
//
// This function has a zoned-nonzoned split nature because refinePublicRelativeTo,
// which calls refineMaybeZonedDateTimeObjectLike, has a split nature.
// We *could* create the marker system at that time, but there are numerous
// short-circuits during rounding/totalling that could make it premature.
export function createMarkerSpanOps(
  relativeToSlots: RelativeToSlots,
): MarkerSpanOps {
  const { calendar } = relativeToSlots

  if (isZonedEpochSlots(relativeToSlots)) {
    const { timeZone } = relativeToSlots

    return {
      marker: relativeToSlots,
      markerToEpochNano: extractEpochNano as MarkerToEpochNano,
      moveMarker: bindArgs(moveZonedEpochs, timeZone, calendar) as Callable,
      diffMarkers: bindArgs(
        diffZonedEpochsExact,
        timeZone,
        calendar,
      ) as Callable,
    }
  }

  const marker = slotsWithCalendar(
    normalizeDateTimeMarker(relativeToSlots),
    calendar,
  )

  return {
    marker,
    markerToEpochNano: isoDateTimeToEpochNano as MarkerToEpochNano,
    moveMarker: moveDateTime as Callable,
    diffMarkers: bindArgs(diffDateTimesExact, calendar) as Callable,
  }
}

// Utils
// -----------------------------------------------------------------------------

// NOTE: bad name. it moves the marker and RETURNS the epoch-nanoseconds
export function moveMarkerToEpochNano(
  markerMoveOps: MarkerMoveOps,
  durationFields: DurationFields,
): BigNano {
  return markerMoveOps.markerToEpochNano(
    markerMoveOps.moveMarker(markerMoveOps.marker, durationFields),
  )
}

// Done for Duration::round/total, which has a forked flow because .relativeTo
// could be multiple things.
// See note in createMarkerSpanOps about short-circuiting.
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

// Done with MarkerSpanOps, which has a forked flow because .relativeTo in the
// Duration::round/total functions could be multiple things.
// See note in createMarkerSpanOps about short-circuiting.
export function checkMarkerSpanInBounds(
  markerSpanOps: MarkerSpanOps,
  endMarker: MovableMarker,
): void {
  // Zoned math is already bounded by Instant conversion. Plain relative math
  // must explicitly validate the origin and destination as ISO date-times.
  if (!isZonedEpochSlots(markerSpanOps.marker)) {
    checkMarkerInBounds(
      markerSpanOps.marker as CalendarDateFields | CalendarDateTimeFields,
    )
    checkMarkerInBounds(
      endMarker as CalendarDateFields | CalendarDateTimeFields,
    )
  }
}

function normalizeDateTimeMarker(
  marker: CalendarDateFields | CalendarDateTimeFields,
): CalendarDateTimeFields {
  return combineDateAndTime(
    marker,
    'hour' in marker ? marker : timeFieldDefaults,
  )
}

function checkMarkerInBounds(
  marker: CalendarDateFields | CalendarDateTimeFields,
): void {
  checkIsoDateTimeInBounds(normalizeDateTimeMarker(marker))
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
