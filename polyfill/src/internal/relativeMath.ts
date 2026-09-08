import { bigNanoInUtcDay } from './bigNano'
import { type CalendarImpl } from './calendarImpl'
import {
  diffDateTimesExact,
  diffIsoDates,
  diffIsoEpochs,
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
  moveDateTime,
  moveDateTimeByNano,
  moveEpochNanoByNano,
  moveIsoDurationDate,
  moveZonedEpochSlots,
} from './move'
import { ZonedEpochNanoFields } from './slots'
import { checkIsoDateTimeInBounds } from './temporalLimits'
import { TimeZone } from './timeZone'
import { getSingleInstantFor, zonedEpochSlotsToIso } from './timeZoneMath'
import { Unit } from './units'
import { compareBigInts, fabricateNearHalfFraction } from './utils'

// the relative-to "origin"
export type RelativeToSlots =
  | (CalendarDateFields & { calendar: CalendarImpl })
  | (ZonedEpochNanoFields & { calendar: CalendarImpl })

export type ZonedEpochMarker = ZonedEpochNanoFields & { calendar: CalendarImpl }

export type MovedDateToEpochNano = (movedIsoDate: CalendarDateFields) => bigint

// Relative Ops
// -----------------------------------------------------------------------------
// These adapters configure the movement and epoch-conversion mechanics used by
// the generic relative rounding and totaling layers.

/*
Everything the relative (calendar-aware) rounding core needs in order to probe
the epoch-nanosecond boundaries of a calendar unit.

The origin's epoch is stored directly, and the caller supplies two operations:

- Date movement closes over the origin's ISO date and chooses calendar arithmetic
  for year/month operations or ISO movement for fixed day/week helpers. Each
  movement retains the required intermediate date bounds check.
- Date-to-epoch conversion closes over the origin's time and time zone only when
  needed. Plain-date operations can retain a direct ISO date conversion.

Selecting these operations keeps calendar-month and time-zone dependencies out
of fixed helpers that do not need them.

Zoned-ness is deliberately NOT recorded here. Nothing about probing needs it;
it only selects a rounding strategy, so it travels as an argument to
roundRelativeDuration alongside the units it is weighed against.
*/
export interface RelativeOps {
  originEpochNano: bigint
  moveDate: (duration: DurationFields) => CalendarDateFields
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
    originEpochNano: isoDateToEpochNano(origin),
    moveDate: (duration) => moveDate(calendar, origin, duration),
    movedDateToEpochNano: isoDateToEpochNano,
  }
}

// For a PlainDateTime origin, which carries a real wall-clock time
export function createDateTimeRelativeOps(
  calendar: CalendarImpl,
  origin: CalendarDateTimeFields,
): RelativeOps {
  return {
    originEpochNano: isoDateTimeToEpochNano(origin),
    moveDate: (duration) => moveDate(calendar, origin, duration),
    movedDateToEpochNano: (movedIsoDate) =>
      isoDateTimeToEpochNano(combineDateAndTime(movedIsoDate, origin)),
  }
}

export function createPlainIsoOps(origin: CalendarDateTimeFields): RelativeOps {
  return {
    originEpochNano: isoDateTimeToEpochNano(origin),
    moveDate: (duration) => moveIsoDurationDate(origin, duration),
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
    // NOT re-derived from the origin above. When the origin's wall-clock time
    // is ambiguous or skipped, converting it back would land on a different
    // instant than the one the ZonedDateTime actually holds.
    originEpochNano: slots.epochNanoseconds,

    moveDate: (duration) => moveDate(calendar, origin, duration),
    movedDateToEpochNano: (movedIsoDate) =>
      getSingleInstantFor(timeZone, combineDateAndTime(movedIsoDate, origin)),
  }
}

export function createZonedIsoOps(slots: ZonedEpochNanoFields): RelativeOps {
  const origin = zonedEpochSlotsToIso(slots)
  return {
    originEpochNano: slots.epochNanoseconds,
    moveDate: (duration) => moveIsoDurationDate(origin, duration),
    movedDateToEpochNano: (movedIsoDate) =>
      getSingleInstantFor(
        slots.timeZone,
        combineDateAndTime(movedIsoDate, origin),
      ),
  }
}

// Duration spans
// -----------------------------------------------------------------------------
// Span operations construct a real duration endpoint, then balance it back
// against its relative origin for rounding or totaling.

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
  if (isZonedEpochSlots(relativeToSlots)) {
    return spanZonedRelativeDuration(
      relativeToSlots,
      durationFields,
      largestUnit,
    )
  }

  return spanPlainRelativeDuration(relativeToSlots, durationFields, largestUnit)
}

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

// ISO day/week spans avoid retaining calendar month/year movement while
// preserving the same midnight anchor and endpoint range checks.
export function spanPlainIsoRelativeDuration(
  relativeToFields: CalendarDateFields,
  durationFields: DurationFields,
  largestUnit: Unit.Day | Unit.Week,
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
    diffIsoEpochs(largestUnit, isoDateTimeToEpochNano(origin), endEpochNano),
    endEpochNano,
    createPlainIsoOps(origin),
  ]
}

// ISO day/week spans reconstruct the endpoint without retaining general
// calendar movement, while preserving zoned ambiguity and bounds behavior.
export function spanZonedIsoRelativeDuration(
  relativeToSlots: ZonedEpochMarker,
  durationFields: DurationFields,
  largestUnit: Unit.Day | Unit.Week,
): [DurationFields, bigint, RelativeOps] {
  const { timeZone } = relativeToSlots
  const diffDate = (start: CalendarDateFields, end: CalendarDateFields) =>
    diffIsoDates(largestUnit === Unit.Week, start, end)
  let epochNanoseconds = relativeToSlots.epochNanoseconds

  if (durationFields.weeks || durationFields.days) {
    const origin = zonedEpochSlotsToIso(relativeToSlots)
    epochNanoseconds = getSingleInstantFor(
      timeZone,
      combineDateAndTime(moveIsoDurationDate(origin, durationFields), origin),
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
    createZonedIsoOps(relativeToSlots),
  ]
}

// Relative endpoint movement
// -----------------------------------------------------------------------------
// This entry point constructs the actual endpoint of a supplied duration.

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

// Relative marker movement
// -----------------------------------------------------------------------------
// Marker movement probes unit boundaries without constructing a public result.

/*
Moves the origin by a DATE-ONLY duration to probe a rounding or totaling marker.
Unlike moveRelativeEndpointToEpochNano, this does not construct the duration's
actual endpoint.

This is the spec's window/threshold math: add through CalendarDateAdd on the ISO
date, re-attach the origin's wall-clock time, then convert. The only range check
is the date-level one inside moveDate, which probes the date at noon and so
admits the extra ISO day at each edge.
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

  return relativeOps.movedDateToEpochNano(relativeOps.moveDate(dateDuration))
}

// Relative interval windows
// -----------------------------------------------------------------------------
// Window mechanics position an epoch within adjacent relative-unit boundaries.

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

  const epochNano0 = moveRelativeToEpochNano(relativeOps, startDurationFields)
  const epochNano1 = moveRelativeToEpochNano(relativeOps, endDurationFields)
  return { epochNano0, epochNano1, endDurationFields }
}

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

// Relative-type predicates
// -----------------------------------------------------------------------------
// These small helpers select the appropriate relative arithmetic family.

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
