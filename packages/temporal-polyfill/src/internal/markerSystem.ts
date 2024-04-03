import { BigNano } from './bigNano'
import { DiffOps, MoveOps } from './calendarOps'
import { diffDateTimesExact, diffZonedEpochsExact } from './diff'
import { DurationFields } from './durationFields'
import {
  IsoDateFields,
  IsoDateTimeFields,
  isoTimeFieldDefaults,
} from './isoFields'
import { moveDateTime, moveZonedEpochs } from './move'
import { DateSlots, EpochAndZoneSlots, ZonedEpochSlots } from './slots'
import { isoToEpochNano } from './timeMath'
import { TimeZoneOps } from './timeZoneOps'
import { Unit } from './units'
import { Callable, bindArgs } from './utils'

// the "origin"
export type RelativeToSlots<C, T> = DateSlots<C> | ZonedEpochSlots<C, T>

// the "origin", returned from bag refining
export type RelativeToSlotsNoCalendar<T> = IsoDateFields | EpochAndZoneSlots<T>

// a date marker that's moved away from the "origin"
export type Marker = IsoDateFields | IsoDateTimeFields | ZonedEpochSlots

// Generic System
// -----------------------------------------------------------------------------

export type MarkerSystem<CO> = [Marker, CO, TimeZoneOps?]

export function createMarkerSystem<C, CO, T>(
  getCalendarOps: (calendarSlot: C) => CO,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  relativeToSlots: RelativeToSlots<C, T>,
): MarkerSystem<CO> {
  const calendarOps = getCalendarOps(relativeToSlots.calendar)

  if (isZonedEpochSlots(relativeToSlots)) {
    return [
      relativeToSlots,
      calendarOps,
      getTimeZoneOps(relativeToSlots.timeZone),
    ]
  }

  return [
    // convert IsoDateFields->IsoDateTimeFields
    // because expected in createMoveMarker/createDiffMarkers
    { ...relativeToSlots, ...isoTimeFieldDefaults },
    calendarOps,
  ]
}

// Atomic Operations
// -----------------------------------------------------------------------------

export type MoveMarker = (
  marker: Marker,
  durationFields: DurationFields,
) => Marker

export type DiffMarkers = (
  marker0: Marker,
  marker1: Marker,
  largestUnit: Unit,
) => DurationFields

export type MarkerToEpochNano = (marker: Marker) => BigNano

export function createMoveMarker(
  calendarOps: MoveOps,
  timeZoneOps: TimeZoneOps | undefined,
): MoveMarker {
  if (timeZoneOps) {
    return bindArgs(moveZonedEpochs, calendarOps, timeZoneOps) as Callable
  }
  return bindArgs(moveDateTime, calendarOps) as Callable
}

export function createDiffMarkers(
  calendarOps: DiffOps,
  timeZoneOps: TimeZoneOps | undefined,
): DiffMarkers {
  if (timeZoneOps) {
    return bindArgs(diffZonedEpochsExact, calendarOps, timeZoneOps) as Callable
  }
  return bindArgs(diffDateTimesExact, calendarOps) as Callable
}

export function anyMarkerToEpochNano(marker: Marker): BigNano {
  return (
    (marker as ZonedEpochSlots).epochNanoseconds ||
    isoToEpochNano(marker as IsoDateTimeFields)!
  )
}

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

// System w/ Diff Operations
// -----------------------------------------------------------------------------

export type MarkerMoveSystem = [Marker, MarkerToEpochNano, MoveMarker]

export type MarkerDiffSystem = [...MarkerMoveSystem, DiffMarkers]

export function createMarkerDiffSystem<C, T>(
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  relativeToSlots: RelativeToSlots<C, T>,
): MarkerDiffSystem {
  const [marker, calendarOps, timeZoneOps] = createMarkerSystem(
    getCalendarOps,
    getTimeZoneOps,
    relativeToSlots,
  )
  return [
    marker,
    anyMarkerToEpochNano,
    createMoveMarker(calendarOps, timeZoneOps),
    createDiffMarkers(calendarOps, timeZoneOps),
  ]
}
