import { type CalendarImpl } from './calendarImpl'
import { diffDateTimesExact, diffZonedEpochsExact } from './diff'
import { DurationFields } from './durationFields'
import { durationHasDateParts } from './durationMath'
import { isoDateTimeToEpochNano, isoDateToEpochNano } from './epochMath'
import { timeFieldDefaults } from './fieldNames'
import { CalendarDateFields, CalendarDateTimeFields } from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { moveDate, moveDateTime, moveZonedEpochSlots } from './move'
import { ZonedEpochNanoFields } from './slots'
import { checkIsoDateTimeInBounds } from './temporalLimits'
import { TimeZone } from './timeZone'
import { getSingleInstantFor, zonedEpochSlotsToIso } from './timeZoneMath'
import { Unit } from './units'

// the relative-to "origin"
export type RelativeToSlots =
  | (CalendarDateFields & { calendar: CalendarImpl })
  | (ZonedEpochNanoFields & { calendar: CalendarImpl })

export type ZonedEpochMarker = ZonedEpochNanoFields & { calendar: CalendarImpl }

export type MovedDateToEpochNano = (movedIsoDate: CalendarDateFields) => bigint

// Relative Ops
// -----------------------------------------------------------------------------

/*
Everything the relative (calendar-aware) rounding core needs in order to probe
the epoch-nanosecond boundaries of a calendar unit.

Modeled on the spec, where RoundRelativeDuration and TotalRelativeDuration take
a concrete (isoDateTime, timeZone, calendar) triple rather than a set of
injected marker operations. Two differences from the spec's shape:

- The origin is only its DATE part. Every probe adds whole calendar units, so
  the origin's wall-clock time never varies and does not need to be carried
  through the core.
- That time, along with the time zone, is closed over by the one operation that
  differs between flavors: turning a moved ISO date back into
  epoch-nanoseconds. Injecting it keeps the rounding core free of any static
  reference to time-zone or time-field machinery, so a funcApi build that only
  touches plain dates tree-shakes both away.

Zoned-ness is deliberately NOT recorded here. Nothing about probing needs it;
it only selects a rounding strategy, so it travels as an argument to
roundRelativeDuration alongside the units it is weighed against.
*/
export interface RelativeOps {
  origin: CalendarDateFields
  originEpochNano: bigint
  calendar: CalendarImpl
  movedDateToEpochNano: MovedDateToEpochNano
}

// For a PlainDate origin, whose time is midnight. Deliberately avoids the
// date-time conversion so a plain-date-only funcApi build never pulls in the
// time-field math.
export function createDateRelativeOps(
  calendar: CalendarImpl,
  origin: CalendarDateFields,
): RelativeOps {
  return {
    origin,
    originEpochNano: isoDateToEpochNano(origin),
    calendar,
    movedDateToEpochNano: isoDateToEpochNano,
  }
}

// For a PlainDateTime origin, which carries a real wall-clock time
export function createDateTimeRelativeOps(
  calendar: CalendarImpl,
  origin: CalendarDateTimeFields,
): RelativeOps {
  return {
    origin,
    originEpochNano: isoDateTimeToEpochNano(origin),
    calendar,
    movedDateToEpochNano: (movedIsoDate) =>
      isoDateTimeToEpochNano(combineDateAndTime(movedIsoDate, origin)),
  }
}

export function createZonedRelativeOps(
  calendar: CalendarImpl,
  timeZone: TimeZone,
  slots: ZonedEpochNanoFields,
): RelativeOps {
  // memoized, so repeated window probes reuse the offset/ISO conversion
  const origin = zonedEpochSlotsToIso(slots)

  return {
    origin,

    // NOT re-derived from the origin above. When the origin's wall-clock time
    // is ambiguous or skipped, converting it back would land on a different
    // instant than the one the ZonedDateTime actually holds.
    originEpochNano: slots.epochNanoseconds,

    calendar,
    movedDateToEpochNano: (movedIsoDate) =>
      getSingleInstantFor(timeZone, combineDateAndTime(movedIsoDate, origin)),
  }
}

/*
Moves the origin by a DATE-ONLY duration and returns epoch-nanoseconds.

This is the spec's window/threshold math: add through CalendarDateAdd on the ISO
date, re-attach the origin's wall-clock time, then convert. The only range check
is the date-level one inside moveDate, which probes the date at noon and so
admits the extra ISO day at each edge. No date-time check applies here, which is
what lets a bubbling threshold sit outside the representable date-time range
while still rejecting a genuinely out-of-range calendar date.
*/
export function moveRelativeToEpochNano(
  relativeOps: RelativeOps,
  dateDuration: DurationFields,
): bigint {
  // A zero-length move reuses the origin's own epoch-nanoseconds rather than
  // round-tripping the wall-clock origin, which would distort the window across
  // a time-zone transition. Mirrors ComputeNudgeWindow's same-as-origin case.
  if (!durationHasDateParts(dateDuration)) {
    return relativeOps.originEpochNano
  }

  return relativeOps.movedDateToEpochNano(
    moveDate(relativeOps.calendar, relativeOps.origin, dateDuration),
  )
}

// Duration spans
// -----------------------------------------------------------------------------

/*
Builds the endpoint of `relativeTo + durationFields`, diffs it back against the
origin to produce a balanced duration, and returns the ops needed to round or
total that duration.

Shared by Duration::round and Duration::total, mirroring the spec, where each
public method picks its endpoint operation by relativeTo flavor and then hands
both endpoints to the matching Difference*WithRounding / Difference*WithTotal.

Unlike the window math above, these endpoints ARE spec-visible date-times, so
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
  const { calendar } = relativeToSlots

  if (isZonedEpochSlots(relativeToSlots)) {
    const { timeZone } = relativeToSlots

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

/*
Applies two durations to relativeTo in sequence and diffs the result back
against the origin. Mirrors AddDurations, which applies its Add operation once
per duration; each application range-checks, so an intermediate that overshoots
throws even when the end lands back inside the limits.
*/
export function addRelativeDurations(
  relativeToSlots: RelativeToSlots,
  durationFields0: DurationFields,
  durationFields1: DurationFields,
  largestUnit: Unit,
): DurationFields {
  const { calendar } = relativeToSlots

  if (isZonedEpochSlots(relativeToSlots)) {
    const { timeZone } = relativeToSlots
    const midSlots = moveZonedEpochSlots(relativeToSlots, durationFields0)
    const endSlots = moveZonedEpochSlots(midSlots, durationFields1)

    return diffZonedEpochsExact(
      timeZone,
      calendar,
      relativeToSlots,
      endSlots,
      largestUnit,
    )
  }

  const origin = combineDateAndTime(relativeToSlots, timeFieldDefaults)
  const mid = moveDateTime(calendar, origin, durationFields0)
  const end = moveDateTime(calendar, mid, durationFields1)

  return diffDateTimesExact(calendar, origin, end, largestUnit)
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

// Utils
// -----------------------------------------------------------------------------

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
