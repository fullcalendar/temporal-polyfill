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

export type IsoMarker = CalendarDateFields | CalendarDateTimeFields

// A date/time marker that can be moved away from the relative-to origin and
// then compared back against it. Zoned relative math carries the time zone and
// calendar in RelativeMath, so moved zoned markers only need epoch nanoseconds.
export type Marker = IsoMarker | EpochSlots

export type RelativeMarker = CalendarDateTimeFields | EpochSlots

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

export interface MarkerMath {
  marker: Marker
  markerToEpochNano: MarkerToEpochNano
  moveMarker: MoveMarker
}

export interface RelativeMath extends MarkerMath {
  marker: RelativeMarker
  diffMarkers: DiffMarkers
  isZoned: boolean
}

export function createMarkerMath(
  marker: Marker,
  markerToEpochNano: MarkerToEpochNano,
  moveMarker: MoveMarker,
): MarkerMath {
  return { marker, markerToEpochNano, moveMarker }
}

export function moveMarkerToEpochNano(
  markerMath: MarkerMath,
  durationFields: DurationFields,
): BigNano {
  return markerMath.markerToEpochNano(
    markerMath.moveMarker(markerMath.marker, durationFields),
  )
}

export function createRelativeMath(
  relativeToSlots: RelativeToSlots,
): RelativeMath {
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
        calendarId,
      ) as Callable,
      isZoned: true,
    }
  }

  const marker = createPlainDateTimeMarker(relativeToSlots as AbstractDateSlots)

  return {
    marker,
    markerToEpochNano: isoMarkerToEpochNano as MarkerToEpochNano,
    moveMarker: bindArgs(moveDateTime, calendar) as Callable,
    diffMarkers: bindArgs(diffDateTimesExact, calendarId) as Callable,
    isZoned: false,
  }
}

// Utils
// -----------------------------------------------------------------------------

export function isZonedEpochSlots(
  marker: RelativeToSlots | undefined,
): marker is ZonedEpochSlots
export function isZonedEpochSlots(
  marker: Marker | undefined,
): marker is EpochSlots
export function isZonedEpochSlots(
  marker: Marker | RelativeToSlots | undefined,
): marker is EpochSlots | ZonedEpochSlots
export function isZonedEpochSlots(
  marker: Marker | RelativeToSlots | undefined,
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

export function isoMarkerToEpochNano(marker: Marker): BigNano {
  if (!isZonedEpochSlots(marker)) {
    return isoDateTimeToEpochNano(
      combineDateAndTime(marker, 'hour' in marker ? marker : timeFieldDefaults),
    )!
  }
  return marker.epochNanoseconds
}

export function checkRelativeMarkersInBounds(
  relativeMath: RelativeMath,
  endMarker: Marker,
): void {
  // Zoned math is already bounded by Instant conversion. Plain relative math
  // must explicitly validate the origin and destination as ISO date-times.
  if (!relativeMath.isZoned) {
    checkIsoMarkerInBounds(relativeMath.marker as IsoMarker)
    checkIsoMarkerInBounds(endMarker as IsoMarker)
  }
}

function checkIsoMarkerInBounds(marker: IsoMarker): void {
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
  marker: Marker | RelativeToSlots | undefined,
): boolean {
  return unit <= Unit.Day - (isZonedEpochSlots(marker) ? 1 : 0)
}
