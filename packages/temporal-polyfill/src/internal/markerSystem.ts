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
  DateSlots,
  EpochAndZoneSlots,
  ZonedEpochSlots,
  extractEpochNano,
} from './slots'
import { isoToEpochNano } from './timeMath'
import { NativeTimeZone, queryNativeTimeZone } from './timeZoneNative'
import { Unit } from './units'
import { Callable, bindArgs } from './utils'

// the "origin"
export type RelativeToSlots = DateSlots | ZonedEpochSlots

// the "origin", returned from bag refining
export type RelativeToSlotsNoCalendar = IsoDateFields | EpochAndZoneSlots

// a date marker that's moved away from the "origin"
export type Marker = IsoDateFields | IsoDateTimeFields | ZonedEpochSlots

export type MarkerSystem = [Marker, NativeTimeZone?]

export function createMarkerSystem(
  relativeToSlots: RelativeToSlots,
): MarkerSystem {
  if (isZonedEpochSlots(relativeToSlots)) {
    return [relativeToSlots, queryNativeTimeZone(relativeToSlots.timeZone)]
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
  nativeTimeZone: NativeTimeZone | undefined,
): MarkerToEpochNano {
  return (
    nativeTimeZone ? extractEpochNano : isoToEpochNano
  ) as MarkerToEpochNano
}

export function createMoveMarker(
  nativeTimeZone: NativeTimeZone | undefined,
  calendarId: string,
): MoveMarker {
  if (nativeTimeZone) {
    return bindArgs(moveZonedEpochs, nativeTimeZone, calendarId) as Callable
  }
  return bindArgs(moveDateTime, calendarId) as Callable
}

export function createDiffMarkers(
  nativeTimeZone: NativeTimeZone | undefined,
  calendarId: string,
): DiffMarkers {
  if (nativeTimeZone) {
    return bindArgs(
      diffZonedEpochsExact,
      nativeTimeZone,
      calendarId,
    ) as Callable
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
