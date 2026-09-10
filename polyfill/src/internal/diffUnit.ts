import { RoundingModeEnum, UnitDiffRoundingTuple } from '../options/model'
import { divideBigNanoToExactNumber } from './bigNano'
import { type CalendarImpl } from './calendarImpl'
import {
  compareIsoDates,
  diffCalendarDates,
  diffZonedEpochsByDays,
} from './diff'
import {
  DurationFields,
  clearDurationFields,
  durationFieldNamesAsc,
  durationTimeFieldDefaults,
} from './durationFields'
import { computeDurationSign, durationTimeToBigNano } from './durationMath'
import { isoDateTimeToEpochNano, isoDateToEpochNano } from './epochMath'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { moveDateByDays, moveToStartOfMonth } from './move'
import {
  RelativeOps,
  createDateRelativeOps,
  moveRelativeMarkerToEpochNano,
} from './relativeMath'
import { roundRelativeUnit, totalRelativeUnit } from './relativeUnit'
import { computeBigNanoInc, computeNanoInc, roundBigNanoToInc } from './round'
import { roundNumberToInc } from './roundNumber'
import { ZonedEpochNanoFields } from './slots'
import {
  checkEpochNanoInBounds,
  checkIsoDateInBounds,
  checkIsoDateTimeEpochNanoInBounds,
} from './temporalLimits'
import { timeFieldsToNano } from './timeFieldMath'
import { TimeZone } from './timeZone'
import { getSingleInstantFor, zonedEpochSlotsToIso } from './timeZoneMath'
import {
  DayWeekUnit,
  TimeUnit,
  Unit,
  YearMonthUnit,
  unitNanoMap,
} from './units'

// Scalar unit differences for the func API. Inputs and rounding settings have
// already been validated and refined by the API layer.
//
// Each helper mirrors what temporal-utils does with the class API, but produces
// ONE unit's value instead of a Duration:
// - Rounded (a mode is given): `until` with largestUnit = smallestUnit = unit.
// - Total (no mode): `until` at the type's default precision, then
//   Duration.total(unit) relative to the origin. Exact, with no increment.
// Equal inputs are zero in both, and never reach the probing cores.

// Uniform-unit differences
// -----------------------------------------------------------------------------
// Time units, and days for plain types, are uniform nanosecond intervals.
// Round the exact interval as a bigint, then divide to a scalar.

// Mirrors diffEpochNanosRounded, then totalDayTimeDuration
export function countEpochNanoUnit(
  start: bigint,
  end: bigint,
  unit: TimeUnit,
  [roundingInc, roundingMode]: UnitDiffRoundingTuple,
): number {
  let diffNano = end - start

  if (roundingMode !== undefined) {
    diffNano = roundBigNanoToInc(
      diffNano,
      computeBigNanoInc(unit, roundingInc),
      roundingMode,
    )
  }

  return divideBigNanoToExactNumber(diffNano, unitNanoMap[unit])
}

// Mirrors diffDateTimesRounded's sub-day branch
export function countDateTimeUnit(
  start: CalendarDateTimeFields,
  end: CalendarDateTimeFields,
  unit: TimeUnit,
  rounding: UnitDiffRoundingTuple,
): number {
  return countEpochNanoUnit(
    isoDateTimeToEpochNano(start),
    isoDateTimeToEpochNano(end),
    unit,
    rounding,
  )
}

// Mirrors diffTimesRounded, then totalDayTimeDuration
export function countTimeUnit(
  start: TimeFields,
  end: TimeFields,
  unit: TimeUnit,
  [roundingInc, roundingMode]: UnitDiffRoundingTuple,
): number {
  let diffNano = timeFieldsToNano(end) - timeFieldsToNano(start)

  if (roundingMode !== undefined) {
    diffNano = roundNumberToInc(
      diffNano,
      computeNanoInc(unit, roundingInc),
      roundingMode,
    )
  }

  // Converting through bigint canonicalizes -0 and uses the same exact
  // quotient/remainder construction as duration totaling.
  return divideBigNanoToExactNumber(BigInt(diffNano), unitNanoMap[unit])
}

/*
Mirrors diffDatesRounded's and diffDateTimesRounded's day branch, then
spanPlainRelativeDuration's validation and totalDayTimeDuration.

Plain days are uniform, so a rounded diff is bigint rounding of the interval.
A total is the exact interval, but still validates the span the way
Duration.total does for a plain relativeTo: the origin date's midnight and
midnight + duration must both be representable PlainDateTimes.
`originTimeNano` is the origin's time of day.
*/
export function countEpochNanoDays(
  startEpochNano: bigint,
  endEpochNano: bigint,
  originTimeNano: number,
  [roundingInc, roundingMode]: UnitDiffRoundingTuple,
): number {
  let diffNano = endEpochNano - startEpochNano

  if (roundingMode !== undefined) {
    diffNano = roundBigNanoToInc(
      diffNano,
      computeBigNanoInc(Unit.Day, roundingInc),
      roundingMode,
    )
  } else if (diffNano) {
    // A zero total returns before validating relativeTo. Otherwise the
    // origin's midnight and the endpoint, in that frame, must both be
    // representable PlainDateTimes (see countRelativeUnit)
    const originTimeBigNano = BigInt(originTimeNano)
    checkIsoDateTimeEpochNanoInBounds(startEpochNano - originTimeBigNano)
    checkIsoDateTimeEpochNanoInBounds(endEpochNano - originTimeBigNano)
  }

  return divideBigNanoToExactNumber(diffNano, unitNanoMap[Unit.Day])
}

// Relative-unit differences
// -----------------------------------------------------------------------------
// Calendar units, weeks, and zoned days are non-uniform. Their value comes from
// probing the unit window around the endpoint through RelativeOps, exactly as
// the class API does, but reduced to the one unit being asked for.

/*
The type-specific pieces of a relative unit diff. Each func-API type builds
one so that only its own diffing and movement code is retained.

`endEpochNano` and `relativeOps` share a frame: plain date-times use their
origin's midnight (the anchor Duration.total uses for a plain relativeTo), so
their endpoint is shifted back by the origin's time of day. Window fractions
are invariant under that shift, and it lets PlainDateTime reuse PlainDate's
date-only movement.
*/
export interface RelativeUnitDiff {
  diffExact: () => DurationFields // balanced, largestUnit = the diffed unit
  relativeOps: RelativeOps
  endEpochNano: bigint
}

// Mirrors diffYearMonthsRounded
export function countYearMonthUnit(
  calendar: CalendarImpl,
  isoDate0: CalendarDateFields,
  isoDate1: CalendarDateFields,
  unit: YearMonthUnit,
  rounding: UnitDiffRoundingTuple,
): number {
  // PlainYearMonth ignores its reference ISO day. Both `until` and the
  // relativeTo of a total operate on the implicit first-of-month dates.
  const start = moveToStartOfMonth(calendar, isoDate0)
  const end = moveToStartOfMonth(calendar, isoDate1)

  // Equal months are zero before validating either date
  if (!compareIsoDates(start, end)) {
    return 0
  }

  checkIsoDateInBounds(start)
  checkIsoDateInBounds(end)

  return countRelativeUnit(
    unit,
    {
      diffExact: () => diffCalendarDates(calendar, start, end, unit),
      relativeOps: createDateRelativeOps(calendar, start),
      endEpochNano: isoDateToEpochNano(end),
    },
    rounding,
    false,
    unit === Unit.Month,
  )
}

/*
Mirrors the calendar-unit diffs (diffZonedCalendarUnitsRounded,
diffDateTimeCalendarUnitsRounded, diffDateCalendarUnitsRounded) when
rounding, and spanRelativeDuration then totalRelativeDuration when totaling.
Both paths now finish in relativeUnit.ts's shared scalar resolver.
*/
export function countRelativeUnit(
  unit: Unit,
  relativeUnitDiff: RelativeUnitDiff,
  [roundingInc, roundingMode]: UnitDiffRoundingTuple,
  isZoned?: boolean, // zoned durations are validated and rebuilt as Instants
  isPrecisionUnit?: boolean, // is `unit` the type's default smallestUnit?
): number {
  const { diffExact, relativeOps } = relativeUnitDiff
  const durationFields = diffExact()
  let { endEpochNano } = relativeUnitDiff

  // Equal endpoints are zero without probing
  if (!computeDurationSign(durationFields)) {
    return 0
  }

  if (roundingMode !== undefined) {
    // A diff at the type's own precision is already exact (PlainYearMonth
    // months), so the class API skips rounding, and its boundary probes
    if (isPrecisionUnit && roundingInc === 1) {
      return durationFields[durationFieldNamesAsc[unit]]
    }

    return resolveDurationUnit(
      unit,
      durationFields,
      endEpochNano,
      relativeOps,
      roundingInc,
      roundingMode,
    )
  }

  // Total: Duration.total of the exact `until` result, relative to the origin
  if (isZoned) {
    // Duration.total re-adds the duration to relativeTo, which does not
    // always land on the endpoint: an origin in a repeated DST hour resolves
    // to the other instance when `until` builds its intermediate, leaving a
    // time part of 24+ hours. Rebuild the same way (date part, then time
    // part) and validate as an Instant.
    endEpochNano = checkEpochNanoInBounds(
      moveRelativeMarkerToEpochNano(relativeOps, {
        ...durationFields,
        ...durationTimeFieldDefaults,
      }) + durationTimeToBigNano(durationFields),
    )
  } else {
    // Plain durations round-trip exactly, but Duration.total anchors a plain
    // relativeTo at the origin date's midnight and requires both that anchor
    // and the endpoint to be representable PlainDateTimes (mirroring
    // spanPlainRelativeDuration). Matters at the edges: a PlainDate on the
    // extra lower ISO day is valid, but its midnight is not.
    checkIsoDateTimeEpochNanoInBounds(relativeOps.originEpochNano)
    checkIsoDateTimeEpochNanoInBounds(endEpochNano)
  }

  return resolveDurationUnit(
    unit,
    durationFields,
    endEpochNano,
    relativeOps,
    1,
    undefined,
  )
}

/*
Mirrors diffZonedCalendarUnitsRounded with a day or week smallestUnit, and
spanZonedRelativeDuration then totalRelativeDuration when totaling, without
DurationFields. The scalar counterpart of countRelativeUnit, kept separate so
these builds retain neither calendar arithmetic nor duration-field plumbing.
Same pipeline and shared scalar resolver: exact diff, then window probing. Zoned
days vary in length, so even days probe through the time zone.
*/
export function countZonedDayWeekUnit(
  unit: DayWeekUnit,
  timeZone: TimeZone,
  startZoned: ZonedEpochNanoFields,
  endZoned: ZonedEpochNanoFields, // a different instant than startZoned
  [roundingInc, roundingMode]: UnitDiffRoundingTuple,
): number {
  const daysInUnit = unit === Unit.Week ? 7 : 1
  const startEpochNano = startZoned.epochNanoseconds
  const originIsoDateTime = zonedEpochSlotsToIso(startZoned) // memoized
  const [deltaDays, remainderNano] = diffZonedEpochsByDays(
    timeZone,
    startZoned,
    endZoned,
  )

  // A probe marker: the origin moved by ISO days, keeping its wall-clock
  // time. A zero move reuses the origin's own instant rather than
  // re-resolving a possibly ambiguous wall-clock time.
  const moveByDays = (days: number): bigint =>
    days
      ? getSingleInstantFor(
          timeZone,
          combineDateAndTime(
            checkIsoDateInBounds(moveDateByDays(originIsoDateTime, days)),
            originIsoDateTime,
          ),
        )
      : startEpochNano

  // Duration.total re-adds the duration to relativeTo as an Instant, which
  // does not always land on the endpoint (see countRelativeUnit)
  const endEpochNano =
    roundingMode === undefined
      ? checkEpochNanoInBounds(moveByDays(deltaDays) + BigInt(remainderNano))
      : endZoned.epochNanoseconds

  // Weeks fold whole seven-day groups; leftover days reappear as the window
  // fraction. The instants differ, so one of these is nonzero.
  const sign = Math.sign(deltaDays) || Math.sign(remainderNano)
  const wholeValue = Math.trunc(deltaDays / daysInUnit)

  const moveValueToEpochNano = (value: number): bigint =>
    moveByDays(value * daysInUnit)

  return roundingMode === undefined
    ? totalRelativeUnit(wholeValue, sign, endEpochNano, moveValueToEpochNano)
    : roundRelativeUnit(
        wholeValue,
        sign,
        endEpochNano,
        moveValueToEpochNano,
        roundingInc,
        roundingMode,
      )[0]
}

// Relative-unit cores
// -----------------------------------------------------------------------------
// The DurationFields-to-scalar bridge used by relative diffs. Window resolution
// lives in relativeUnit.ts so class and functional APIs share the scalar leaf.

/*
Bridges a balanced DurationFields value into relativeUnit.ts's scalar resolver,
which is also the leaf used by nudgeRelativeDuration and totalRelativeDuration.
*/
function resolveDurationUnit(
  unit: Unit,
  durationFields: DurationFields,
  endEpochNano: bigint,
  relativeOps: RelativeOps,
  unitWindowInc: number,
  roundingMode: RoundingModeEnum | undefined,
): number {
  const sign = computeDurationSign(durationFields) // nonzero
  const fieldName = durationFieldNamesAsc[unit]

  // Weeks are seven-day groups. Fold whole groups into the unit value; the
  // leftover days reappear as the window fraction.
  if (unit === Unit.Week) {
    durationFields = {
      ...durationFields,
      weeks: durationFields.weeks + Math.trunc(durationFields.days / 7),
    }
  }

  // Larger units stay fixed while the probed unit varies
  const baseDurationFields = clearDurationFields(unit, durationFields)

  const moveValueToEpochNano = (value: number): bigint =>
    moveRelativeMarkerToEpochNano(relativeOps, {
      ...baseDurationFields,
      [fieldName]: value,
    })

  return roundingMode === undefined
    ? totalRelativeUnit(
        durationFields[fieldName],
        sign,
        endEpochNano,
        moveValueToEpochNano,
      )
    : roundRelativeUnit(
        durationFields[fieldName],
        sign,
        endEpochNano,
        moveValueToEpochNano,
        unitWindowInc,
        roundingMode,
      )[0]
}
