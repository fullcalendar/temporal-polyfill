import { bigNanoInUtcDay } from './bigNano'
import { type CalendarImpl } from './calendarImpl'
import {
  diffDateTimesExact,
  diffDatesByDayWeekUnit,
  diffEpochNanosByDayWeekUnit,
  diffZonedDateParts,
  diffZonedEpochsExact,
} from './diff'
import {
  DurationFieldName,
  DurationFields,
  durationFieldNamesAsc,
} from './durationFields'
import { durationHasDateParts, durationTimeToBigNano } from './durationMath'
import { isoDateTimeToEpochNano, isoDateToEpochNano } from './epochMath'
import { timeFieldDefaults } from './fieldNames'
import { CalendarDateFields, CalendarDateTimeFields } from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import {
  moveDate,
  moveDateByDayWeekUnits,
  moveDateTime,
  moveDateTimeByNano,
  moveEpochNanoByNano,
  moveZonedEpochSlots,
} from './move'
import { ZonedEpochNanoFields } from './slots'
import { checkIsoDateTimeInBounds } from './temporalLimits'
import { TimeZone } from './timeZone'
import { getSingleInstantFor, zonedEpochSlotsToIso } from './timeZoneMath'
import { DayWeekUnit, Unit } from './units'
import { compareBigInts, fabricateNearHalfFraction } from './utils'

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
// duration, and return matching RelativeOps. Separate zoned/plain and
// calendar/ISO variants let each caller tree-shake the flavors it never uses.

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

// Day/week spans reconstruct the endpoint without retaining general
// calendar movement, while preserving zoned ambiguity and bounds behavior.
export function spanZonedDayWeekRelativeDuration(
  relativeToSlots: ZonedEpochMarker,
  durationFields: DurationFields,
  largestUnit: DayWeekUnit,
): [DurationFields, bigint, RelativeOps] {
  const { timeZone } = relativeToSlots
  const diffDate = (start: CalendarDateFields, end: CalendarDateFields) =>
    diffDatesByDayWeekUnit(largestUnit === Unit.Week, start, end)
  let epochNanoseconds = relativeToSlots.epochNanoseconds

  if (durationFields.weeks || durationFields.days) {
    const origin = zonedEpochSlotsToIso(relativeToSlots)
    epochNanoseconds = getSingleInstantFor(
      timeZone,
      combineDateAndTime(
        moveDateByDayWeekUnits(origin, durationFields),
        origin,
      ),
    )
  }

  const endSlots = {
    ...relativeToSlots,
    epochNanoseconds: moveEpochNanoByNano(
      epochNanoseconds,
      durationTimeToBigNano(durationFields),
    ),
  }

  return [
    diffZonedDateParts(timeZone, relativeToSlots, endSlots, diffDate),
    endSlots.epochNanoseconds,
    createZonedDayWeekOps(relativeToSlots),
  ]
}

// Day/week spans avoid retaining calendar month/year movement while
// preserving the same midnight anchor and endpoint range checks.
export function spanPlainDayWeekRelativeDuration(
  relativeToFields: CalendarDateFields,
  durationFields: DurationFields,
  largestUnit: DayWeekUnit,
): [DurationFields, bigint, RelativeOps] {
  const origin = checkIsoDateTimeInBounds(
    combineDateAndTime(relativeToFields, timeFieldDefaults),
  )
  const end = moveDateTimeByNano(
    origin,
    BigInt(durationFields.weeks * 7 + durationFields.days) * bigNanoInUtcDay +
      durationTimeToBigNano(durationFields),
  )
  const endEpochNano = isoDateTimeToEpochNano(end)

  return [
    diffEpochNanosByDayWeekUnit(
      largestUnit,
      isoDateTimeToEpochNano(origin),
      endEpochNano,
    ),
    endEpochNano,
    createPlainDayWeekOps(origin),
  ]
}

// Relative interval windows
// -----------------------------------------------------------------------------
// Position an epoch within adjacent relative-unit boundaries. These probes are
// separate from the actual duration endpoints constructed by span operations,
// and may shift one window forward when the balanced duration overshoots.

export function clampRelativeDuration(
  durationFields: DurationFields,
  clampUnit: Unit,
  clampDistance: number,
  relativeOps: RelativeOps,
  epochNanoProgress?: bigint,
) {
  const unitName = durationFieldNamesAsc[clampUnit]
  let startDurationFields = durationFields
  let shifted = false
  let window = computeRelativeDurationWindow(
    startDurationFields,
    unitName,
    clampDistance,
    relativeOps,
  )

  // Calendar-unit rounding uses a finite epoch-nanosecond window. Around dates
  // that constrain, like Jan 31 -> Feb 29, the balanced duration can describe a
  // point just beyond the first truncated window. The spec retries one window
  // later in that case; Duration.total() uses the same operation with trunc.
  if (
    epochNanoProgress &&
    !epochNanoIsWithinWindow(
      epochNanoProgress,
      window.epochNano0,
      window.epochNano1,
      Math.sign(clampDistance),
    )
  ) {
    startDurationFields = {
      ...durationFields,
      [unitName]: durationFields[unitName] + clampDistance,
    }
    shifted = true
    window = computeRelativeDurationWindow(
      startDurationFields,
      unitName,
      clampDistance,
      relativeOps,
    )
  }

  return {
    ...window,
    startDurationFields,
    shifted,
  }
}

function computeRelativeDurationWindow(
  startDurationFields: DurationFields,
  unitName: DurationFieldName,
  clampDistance: number,
  relativeOps: RelativeOps,
) {
  const endDurationFields = {
    ...startDurationFields,
    [unitName]: startDurationFields[unitName] + clampDistance,
  }

  const epochNano0 = moveRelativeMarkerToEpochNano(
    relativeOps,
    startDurationFields,
  )
  const epochNano1 = moveRelativeMarkerToEpochNano(
    relativeOps,
    endDurationFields,
  )
  return { epochNano0, epochNano1, endDurationFields }
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
// operations or ISO day arithmetic for day/week helpers, retaining the
// intermediate date bounds check, then reattaches the origin's time and resolves
// its time zone when needed; plain-date operations use a direct ISO conversion.
// Each factory closes over only the mechanics it needs, keeping unrelated
// dependencies out of fixed helpers.

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

export function createZonedDayWeekOps(
  slots: ZonedEpochNanoFields,
): RelativeOps {
  const origin = zonedEpochSlotsToIso(slots)
  return {
    originEpochNano: slots.epochNanoseconds,
    moveToEpochNano: (duration) =>
      getSingleInstantFor(
        slots.timeZone,
        combineDateAndTime(moveDateByDayWeekUnits(origin, duration), origin),
      ),
  }
}

export function createPlainDayWeekOps(
  origin: CalendarDateTimeFields,
): RelativeOps {
  return {
    originEpochNano: isoDateTimeToEpochNano(origin),
    moveToEpochNano: (duration) =>
      isoDateTimeToEpochNano(
        combineDateAndTime(moveDateByDayWeekUnits(origin, duration), origin),
      ),
  }
}

// Epoch interval arithmetic
// -----------------------------------------------------------------------------
// Pure bigint math on a [epochNano0, epochNano1] window: membership tests and
// the fractional progress used by rounding modes.

function epochNanoIsWithinWindow(
  epochNanoProgress: bigint,
  epochNano0: bigint,
  epochNano1: bigint,
  sign: number,
): boolean {
  if (sign > 0) {
    return (
      compareBigInts(epochNano0, epochNanoProgress) <= 0 &&
      compareBigInts(epochNanoProgress, epochNano1) <= 0
    )
  }

  return (
    compareBigInts(epochNano1, epochNanoProgress) <= 0 &&
    compareBigInts(epochNanoProgress, epochNano0) <= 0
  )
}

export function computeEpochNanoFrac(
  epochNanoProgress: bigint,
  epochNano0: bigint,
  epochNano1: bigint,
): number {
  const denomBig = epochNano1 - epochNano0
  const numeratorBig = epochNanoProgress - epochNano0
  if (!numeratorBig) {
    return 0
  }

  const absNumerator = numeratorBig < 0n ? -numeratorBig : numeratorBig
  const absDenom = denomBig < 0n ? -denomBig : denomBig
  const fracSign =
    compareBigInts(numeratorBig, 0n) === compareBigInts(denomBig, 0n) ? 1 : -1

  if (compareBigInts(absNumerator, absDenom) <= 0) {
    if (absNumerator === absDenom) {
      return fracSign
    }

    return fabricateNearHalfFraction(
      compareBigInts(absNumerator * 2n, absDenom),
      fracSign,
    )
  }

  return Number(numeratorBig) / Number(denomBig)
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
