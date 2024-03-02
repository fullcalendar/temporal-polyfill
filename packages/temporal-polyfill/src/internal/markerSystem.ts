import { BigNano } from './bigNano'
import { DiffOps, MoveOps } from './calendarOps'
import { diffDateTimesExact, diffZonedEpochSlotsExact } from './diff'
import { DurationFields } from './durationFields'
import {
  IsoDateFields,
  IsoDateTimeFields,
  isoTimeFieldDefaults,
} from './isoFields'
import { moveDateTime, moveZonedEpochSlots } from './move'
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

  if ((relativeToSlots as ZonedEpochSlots<C, T>).epochNanoseconds) {
    return [
      relativeToSlots as ZonedEpochSlots<C, T>,
      calendarOps,
      getTimeZoneOps((relativeToSlots as ZonedEpochSlots<C, T>).timeZone),
    ]
  }

  return [{ ...relativeToSlots, ...isoTimeFieldDefaults }, calendarOps]
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
    return bindArgs(moveZonedEpochSlots, calendarOps, timeZoneOps) as Callable
  }
  return bindArgs(moveDateTime as Callable, calendarOps)
}

export function createDiffMarkers(
  calendarOps: DiffOps,
  timeZoneOps: TimeZoneOps | undefined,
): DiffMarkers {
  if (timeZoneOps) {
    return bindArgs(
      diffZonedEpochSlotsExact,
      calendarOps,
      timeZoneOps,
    ) as Callable
  }
  return bindArgs(diffDateTimesExact, calendarOps) as Callable
}

export function anyMarkerToEpochNano(marker: Marker): BigNano {
  return (
    (marker as ZonedEpochSlots).epochNanoseconds ||
    isoToEpochNano(marker as IsoDateTimeFields)!
  )
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
