import { type CalendarImpl } from './calendarImpl'
import { diffDateTimesExact, diffZonedEpochsExact } from './diff'
import { DurationFields } from './durationFields'
import { durationHasDateParts } from './durationMath'
import { isoDateTimeToEpochNano, isoDateToEpochNano } from './epochMath'
import { timeFieldDefaults } from './fieldNames'
import { CalendarDateFields, CalendarDateTimeFields } from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import {
  moveDate,
  moveDateByDayWeekUnits,
  moveDateTime,
  moveZonedEpochSlots,
} from './move'
import { ZonedEpochNanoFields } from './slots'
import { checkIsoDateTimeInBounds } from './temporalLimits'
import { TimeZone } from './timeZone'
import { getSingleInstantFor, zonedEpochSlotsToIso } from './timeZoneMath'
import { Unit } from './units'

// Relative contracts
// -----------------------------------------------------------------------------
// Types shared by relative rounding, totaling, and comparison: the relativeTo
// origin flavors and the RelativeOps adapter that the cores probe through.

// the relative-to "origin"
export type RelativeToSlots =
  | (CalendarDateFields & { calendar: CalendarImpl })
  | (ZonedEpochNanoFields & { calendar: CalendarImpl })

export type ZonedEpochMarker = ZonedEpochNanoFields & { calendar: CalendarImpl }

/*
Everything the relative (calendar-aware) rounding core needs in order to probe
the epoch-nanosecond boundaries of a calendar unit.

The origin's epoch is stored directly, and each factory supplies one operation
that moves the origin's date and converts the result to epoch nanoseconds. The
consumer always needs both steps together, so the callback keeps their ordering
inside the adapter without exposing the intermediate date.

Zoned-ness is deliberately NOT recorded here. Nothing about probing needs it;
it only selects a rounding strategy, so it travels as an argument to
roundRelativeDuration alongside the units it is weighed against.
*/
export interface RelativeOps {
  originEpochNano: bigint
  moveToEpochNano: (duration: DurationFields) => bigint
}

// Relative duration orchestration
// -----------------------------------------------------------------------------
// Entry points used by Duration round/total/compare once relativeTo is refined.
// They dispatch on the origin flavor to the spans below.

/*
Builds the endpoint of `relativeTo + durationFields`, diffs it back against the
origin to produce a balanced duration, and returns the ops needed to round or
total that duration.

Shared by Duration::round and Duration::total, mirroring the spec, where each
public method picks its endpoint operation by relativeTo flavor and then hands
both endpoints to the matching Difference*WithRounding / Difference*WithTotal.

Unlike unit-window probes, these endpoints ARE spec-visible date-times, so
they keep their full range checks.
*/
export function spanRelativeDuration(
  relativeToSlots: RelativeToSlots,
  durationFields: DurationFields,
  largestUnit: Unit,
): [
  balancedDuration: DurationFields,
  endEpochNano: bigint,
  relativeOps: RelativeOps,
] {
  if (isZonedEpochSlots(relativeToSlots)) {
    return spanZonedRelativeDuration(
      relativeToSlots,
      durationFields,
      largestUnit,
    )
  }

  return spanPlainRelativeDuration(relativeToSlots, durationFields, largestUnit)
}

/*
Moves relativeTo by a duration and returns only the resulting instant. Used by
Duration::compare, which never needs the endpoint as a date-time.
*/
export function moveRelativeEndpointToEpochNano(
  relativeToSlots: RelativeToSlots,
  durationFields: DurationFields,
): bigint {
  if (isZonedEpochSlots(relativeToSlots)) {
    return moveZonedEpochSlots(relativeToSlots, durationFields).epochNanoseconds
  }

  return isoDateTimeToEpochNano(
    moveDateTime(
      relativeToSlots.calendar,
      combineDateAndTime(relativeToSlots, timeFieldDefaults),
      durationFields,
    ),
  )
}

// Flavor-specific duration spans
// -----------------------------------------------------------------------------
// Build the endpoint of `relativeTo + duration`, diff it back to a balanced
// duration, and return matching RelativeOps. Separate zoned/plain variants let
// each caller tree-shake the flavor it never uses.

// Zoned callers that already know their relativeTo flavor can use this branch
// directly, allowing the plain branch to tree-shake out.
export function spanZonedRelativeDuration(
  relativeToSlots: ZonedEpochMarker,
  durationFields: DurationFields,
  largestUnit: Unit,
): [DurationFields, bigint, RelativeOps] {
  const { calendar, timeZone } = relativeToSlots

  // AddZonedDateTime range-checks the intermediate ISO date and the resulting
  // epoch-nanoseconds, so no separate endpoint validation is needed.
  const endSlots = moveZonedEpochSlots(relativeToSlots, durationFields)

  return [
    diffZonedEpochsExact(
      timeZone,
      calendar,
      relativeToSlots,
      endSlots,
      largestUnit,
    ),
    endSlots.epochNanoseconds,
    createZonedRelativeOps(calendar, timeZone, relativeToSlots),
  ]
}

// Plain callers that already know their relativeTo flavor can use this branch
// directly, allowing the zoned branch to tree-shake out.
export function spanPlainRelativeDuration(
  relativeToSlots: CalendarDateFields & { calendar: CalendarImpl },
  durationFields: DurationFields,
  largestUnit: Unit,
): [DurationFields, bigint, RelativeOps] {
  const { calendar } = relativeToSlots

  // A plain relativeTo is always a bare date, so the origin is midnight.
  // Both endpoints get rejected as date-times before diffing, matching
  // DifferencePlainDateTimeWithRounding. The origin goes first so that a pair
  // where both are out of range reports the origin, as the spec does.
  const origin = checkIsoDateTimeInBounds(
    combineDateAndTime(relativeToSlots, timeFieldDefaults),
  )
  const end = moveDateTime(calendar, origin, durationFields)

  return [
    diffDateTimesExact(calendar, origin, end, largestUnit),
    isoDateTimeToEpochNano(end),
    // The origin's time is midnight, so the rounding core can stay on the
    // cheaper date-only ops
    createDateRelativeOps(calendar, relativeToSlots),
  ]
}

// Relative marker movement
// -----------------------------------------------------------------------------
// Move the origin by a date-only duration to obtain a probe marker's epoch.
// Windows and bubbling both go through this single choke point.

/*
Moves the origin by a DATE-ONLY duration to probe a rounding or totaling marker.
Unlike moveRelativeEndpointToEpochNano, this does not construct the duration's
actual endpoint.

This is the spec's window/threshold math: add through CalendarDateAdd on the ISO
date, re-attach the origin's wall-clock time, then convert. The only range check
is the date-level one inside moveDate, which probes the date at noon and so
admits the extra ISO day at each edge.
*/
export function moveRelativeMarkerToEpochNano(
  relativeOps: RelativeOps,
  dateDuration: DurationFields,
): bigint {
  // A zero-length move reuses the origin's own epoch-nanoseconds rather than
  // round-tripping the wall-clock origin, which would distort the window across
  // a time-zone transition. Mirrors ComputeNudgeWindow's same-as-origin case.
  if (!durationHasDateParts(dateDuration)) {
    return relativeOps.originEpochNano
  }

  return relativeOps.moveToEpochNano(dateDuration)
}

// Movement and epoch adapters
// -----------------------------------------------------------------------------
// Factories for RelativeOps. Each chooses calendar arithmetic for year/month
// operations or ISO day arithmetic for the func API's day/week helpers,
// retaining the intermediate date bounds check, then reattaches the origin's
// time and resolves its time zone when needed; plain-date operations use a
// direct ISO conversion. Each factory closes over only the mechanics it needs,
// keeping unrelated dependencies out of unit-specific helpers.

export function createZonedRelativeOps(
  calendar: CalendarImpl,
  timeZone: TimeZone,
  slots: ZonedEpochNanoFields,
): RelativeOps {
  // memoized, so repeated window probes reuse the offset/ISO conversion
  const origin = zonedEpochSlotsToIso(slots)

  return {
    // NOT re-derived from the origin above. When the origin's wall-clock time
    // is ambiguous or skipped, converting it back would land on a different
    // instant than the one the ZonedDateTime actually holds.
    originEpochNano: slots.epochNanoseconds,

    moveToEpochNano: (duration) =>
      getSingleInstantFor(
        timeZone,
        combineDateAndTime(moveDate(calendar, origin, duration), origin),
      ),
  }
}

// For a PlainDateTime origin, which carries a real wall-clock time
export function createDateTimeRelativeOps(
  calendar: CalendarImpl,
  origin: CalendarDateTimeFields,
): RelativeOps {
  return {
    originEpochNano: isoDateTimeToEpochNano(origin),
    moveToEpochNano: (duration) =>
      isoDateTimeToEpochNano(
        combineDateAndTime(moveDate(calendar, origin, duration), origin),
      ),
  }
}

// For a PlainDate origin, whose time is midnight. Deliberately avoids the
// date-time conversion so a plain-date-only funcApi build never pulls in the
// time-field math.
export function createDateRelativeOps(
  calendar: CalendarImpl,
  origin: CalendarDateFields,
): RelativeOps {
  return {
    originEpochNano: isoDateToEpochNano(origin),
    moveToEpochNano: (duration) =>
      isoDateToEpochNano(moveDate(calendar, origin, duration)),
  }
}

// For a PlainDate or PlainDateTime origin, probing from the origin's midnight.
// Plain days are uniform, so the time of day never affects a window and the
// func API expresses its endpoints relative to midnight instead.
export function createDateDayWeekOps(origin: CalendarDateFields): RelativeOps {
  return {
    originEpochNano: isoDateToEpochNano(origin),
    moveToEpochNano: (duration) =>
      isoDateToEpochNano(
        moveDateByDayWeekUnits(origin, duration.weeks, duration.days),
      ),
  }
}

// Relative-type and unit predicates
// -----------------------------------------------------------------------------
// Small predicates on origin flavor and unit uniformity that the layers above
// use to select strategies.

export function isZonedEpochSlots(
  slots: RelativeToSlots,
): slots is ZonedEpochMarker {
  return 'timeZone' in slots
}

/*
For PlainDate(Time) origins, days+time are uniform
For ZonedDateTime origins, only time is uniform (days can vary in length)
*/
export function isUniformUnit(
  unit: Unit,
  isZoned: boolean | undefined,
): boolean {
  return unit <= Unit.Day - (isZoned ? 1 : 0)
}
