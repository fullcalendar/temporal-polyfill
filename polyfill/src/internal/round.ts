import { roundingModeFuncs } from '../options/config'
import {
  EpochDisambig,
  OffsetDisambig,
  RoundingModeEnum,
} from '../options/model'
import { bigNanoInUtcDay, divideBigNanoToExactNumber } from './bigNano'
import { type CalendarImpl } from './calendarImpl'
import type { IsoDateTimeInterval } from './calendarInterval'
import {
  DurationFields,
  clearDurationFields,
  durationFieldDefaults,
  durationFieldNamesAsc,
  durationTimeFieldDefaults,
} from './durationFields'
import {
  computeDurationSign,
  durationDayTimeToBigNano,
  durationTimeToBigNano,
  getMaxDurationUnit,
  nanoToDurationDayTimeFields,
  nanoToDurationTimeFields,
} from './durationMath'
import { timeFieldDefaults } from './fieldNames'
import { CalendarDateTimeFields, TimeFields } from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { moveDateByDays } from './move'
import {
  RelativeOps,
  clampRelativeDuration,
  computeEpochNanoFrac,
  isUniformUnit,
  moveRelativeMarkerToEpochNano,
} from './relativeMath'
import { ZonedEpochNanoFields, createZonedEpochNanoSlots } from './slots'
import { checkIsoDateTimeInBounds } from './temporalLimits'
import { nanoToTimeAndDay, timeFieldsToNano } from './timeFieldMath'
import {
  getMatchingInstantFor,
  getStartOfDayInstantFor,
  zonedEpochSlotsToIso,
} from './timeZoneMath'
import {
  DayTimeUnit,
  TimeUnit,
  Unit,
  nanoInHour,
  nanoInMinute,
  unitNanoMap,
} from './units'
import {
  NumberSign,
  compareBigInts,
  divModFloorBigInt,
  divTrunc,
  fabricateNearHalfFraction,
} from './utils'

// Pre-refined zoned value operations
// -----------------------------------------------------------------------------
// ZonedDateTime operations that public callers reach after refining their
// options. They pick a zoned rounding strategy below and rebuild slots, or probe
// local-day boundaries for start-of-day, hours-in-day, and func-API alignment.

/*
Rounds a ZonedDateTime after public callers have already refined the options
into smallestUnit/inc/mode. Accept the original slots object because
zonedEpochSlotsToIso caches by object identity, but return only the canonical
zoned slot fields.
*/
export function roundZonedEpochSlotsToUnit(
  slots: ZonedEpochNanoFields & { calendar: CalendarImpl },
  smallestUnit: DayTimeUnit,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): ZonedEpochNanoFields & { calendar: CalendarImpl } {
  return createZonedEpochNanoSlots(
    smallestUnit === Unit.Day
      ? roundZonedEpochToDay(slots, roundingMode)
      : roundZonedEpochToTime(slots, smallestUnit, roundingInc, roundingMode),
    slots.timeZone,
    slots.calendar,
  )
}

export function computeZonedHoursInDay(
  slots: ZonedEpochNanoFields & { calendar: CalendarImpl },
): number {
  const [epochNano0, epochNano1] = computeZonedDayEpochInterval(slots)

  return divideBigNanoToExactNumber(epochNano1 - epochNano0, nanoInHour)
}

export function computeZonedStartOfDay(
  slots: ZonedEpochNanoFields & { calendar: CalendarImpl },
): ZonedEpochNanoFields & { calendar: CalendarImpl } {
  const { timeZone, calendar } = slots
  const isoDateTime = zonedEpochSlotsToIso(slots)
  const epochNano1 = getStartOfDayInstantFor(
    timeZone,
    combineDateAndTime(isoDateTime, timeFieldDefaults),
  )
  // nudging within-day guarantees in-bounds
  return createZonedEpochNanoSlots(epochNano1, timeZone, calendar)
}

/*
Only for func API
For year/month/week/day only
*/
export function alignZonedEpoch(
  computeAlignment: (
    calendar: CalendarImpl,
    slots: CalendarDateTimeFields,
  ) => CalendarDateTimeFields,
  slots: ZonedEpochNanoFields & { calendar: CalendarImpl },
): bigint {
  const { calendar, timeZone } = slots
  const isoDateTime = zonedEpochSlotsToIso(slots)
  const isoDateTime1 = computeAlignment(calendar, isoDateTime)
  const epochNano1 = getStartOfDayInstantFor(timeZone, isoDateTime1)
  return epochNano1
}

/*
Only for func API
For year/month/week/day only
*/
export function roundZonedEpochToInterval(
  computeInterval: (
    calendar: CalendarImpl,
    slots: CalendarDateTimeFields,
  ) => IsoDateTimeInterval,
  slots: ZonedEpochNanoFields & { calendar: CalendarImpl },
  roundingMode: RoundingModeEnum,
): bigint {
  const { calendar, timeZone } = slots
  const isoSlots = zonedEpochSlotsToIso(slots)
  const [isoDateTime0, isoDateTime1] = computeInterval(calendar, isoSlots)

  const epochNano = slots.epochNanoseconds
  const epochNano0 = getStartOfDayInstantFor(timeZone, isoDateTime0)
  const epochNano1 = getStartOfDayInstantFor(timeZone, isoDateTime1)

  return roundZonedEpochToBounds(
    epochNano,
    epochNano0,
    epochNano1,
    roundingMode,
  )
}

// Duration rounding entry points
// -----------------------------------------------------------------------------
// Rounding for balanced durations with pre-refined units. The relative variant
// selects a nudge strategy from the unit/zoned-ness combination and then bubbles
// overflow into larger units; the day-time variants stay in uniform nanoseconds.

export function roundRelativeDuration(
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: bigint,
  largestUnit: Unit,
  smallestUnit: Unit,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
  relativeOps: RelativeOps,
  isZoned?: boolean, // days are non-uniform, so sub-day rounding needs the zone
): DurationFields {
  if (smallestUnit === Unit.Nanosecond && roundingInc === 1) {
    return durationFields
  }

  // Most zero durations are short-circuited by callers. Zoned sub-day rounding
  // can intentionally reach here for a blank duration because the next-day
  // boundary is observable through the time-zone protocol, so use the positive
  // direction as the spec-default tie direction.
  const sign = (computeDurationSign(durationFields) || 1) as NumberSign
  const nudgeFunc = (
    !isUniformUnit(smallestUnit, isZoned)
      ? nudgeRelativeDuration
      : isZoned && smallestUnit < Unit.Day && largestUnit >= Unit.Day
        ? nudgeZonedTimeDuration
        : nudgeDayTimeDuration
  ) as typeof nudgeRelativeDuration // most general

  let [roundedDurationFields, roundedEpochNano, grewBigUnit] = nudgeFunc(
    sign,
    durationFields,
    endEpochNano,
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    relativeOps,
  )

  // grew a day/week/month/year?
  if (grewBigUnit && smallestUnit !== Unit.Week) {
    roundedDurationFields = bubbleRelativeDuration(
      roundedDurationFields,
      roundedEpochNano,
      largestUnit,
      Math.max(Unit.Day, smallestUnit), // force to Day or larger
      sign,
      relativeOps,
    )
  }

  return roundedDurationFields
}

/*
No rebalancing to units larger than days!
Returns ALL duration fields, some zeroed out
*/
export function roundDayTimeDuration(
  durationFields: DurationFields,
  largestUnit: DayTimeUnit,
  smallestUnit: DayTimeUnit,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): DurationFields {
  const bigNano = durationDayTimeToBigNano(durationFields)
  const roundedBigNano = roundBigNanoToInc(
    bigNano,
    computeBigNanoInc(smallestUnit, roundingInc),
    roundingMode,
  )
  return {
    ...durationFieldDefaults,
    ...nanoToDurationDayTimeFields(roundedBigNano, largestUnit),
  }
}

/*
No rebalancing to units larger than days!
Returns partial result, to be merged with other duration fields
*/
export function roundDayTimeDurationByInc(
  durationFields: DurationFields,
  nanoInc: number,
  roundingMode: RoundingModeEnum,
): Partial<DurationFields> {
  // force <= Day
  const maxUnit = Math.min(getMaxDurationUnit(durationFields), Unit.Day)
  const bigNano = durationDayTimeToBigNano(durationFields)
  const roundedBigNano = roundBigNanoToInc(
    bigNano,
    BigInt(nanoInc),
    roundingMode,
  )
  return nanoToDurationDayTimeFields(roundedBigNano, maxUnit)
}

// Zoned rounding strategies
// -----------------------------------------------------------------------------
// Round a zoned epoch to a calendar day or to a time unit. Days are bounded by
// local starts of day, so they go through epoch intervals; time units round the
// wall-clock value and re-resolve it against the time zone.

// A calendar day is the window between consecutive local starts of day.
// Its duration may differ from 24 hours, and repeated boundaries need clamping.
// Return only the rounded epoch so callers can construct their result slots.
export function roundZonedEpochToDay(
  slots: ZonedEpochNanoFields,
  roundingMode: RoundingModeEnum,
): bigint {
  const [epochNano0, epochNano1] = computeZonedDayEpochInterval(slots)
  return roundZonedEpochToBounds(
    slots.epochNanoseconds,
    epochNano0,
    epochNano1,
    roundingMode,
  )
}

// Time-unit rounding preserves the old offset when resolving a repeated time.
// This path does not need the adjacent local-day boundary computation.
export function roundZonedEpochToTime(
  slots: ZonedEpochNanoFields,
  smallestUnit: TimeUnit,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): bigint {
  if (smallestUnit === Unit.Nanosecond && roundingInc === 1) {
    return slots.epochNanoseconds
  }
  const isoDateTime = zonedEpochSlotsToIso(slots)
  return getMatchingInstantFor(
    slots.timeZone,
    roundDateTimeToInc(
      isoDateTime,
      computeNanoInc(smallestUnit, roundingInc),
      roundingMode,
    ),
    isoDateTime.offsetNanoseconds,
    OffsetDisambig.Prefer,
    EpochDisambig.Compat,
    true,
  )
}

// Wall-clock rounding
// -----------------------------------------------------------------------------
// Round ISO date-time and time fields to a nanosecond increment. PlainDateTime
// and PlainTime call these directly with pre-refined settings, and the zoned
// time-unit strategy above rounds the wall-clock time before re-resolving it.

export function roundDateTimeToInc(
  isoDateTime: CalendarDateTimeFields,
  nanoInc: number,
  roundingMode: RoundingModeEnum,
): CalendarDateTimeFields {
  // Time rounding can carry into the neighboring ISO date. Keep the original
  // date and time together here so the day delta is applied to the same
  // wall-clock value that produced the rounded time.
  const [roundedTimeFields, dayDelta] = roundTimeToInc(
    isoDateTime,
    nanoInc,
    roundingMode,
  )

  const roundedIsoDate = moveDateByDays(isoDateTime, dayDelta)
  const roundedIsoDateTime = combineDateAndTime(
    roundedIsoDate,
    roundedTimeFields,
  )
  checkIsoDateTimeInBounds(roundedIsoDateTime)
  return roundedIsoDateTime
}

export function roundTimeToInc(
  timeFields: TimeFields,
  nanoInc: number,
  roundingMode: RoundingModeEnum,
): [TimeFields, number] {
  return nanoToTimeAndDay(
    roundNumberToInc(timeFieldsToNano(timeFields), nanoInc, roundingMode),
  )
}

// Relative-duration rounding strategies
// -----------------------------------------------------------------------------
// These do the heavy lifting of relative rounding: nudge the duration toward the
// lower/upper marker of its unit window (returning the nudged duration, the
// epoch it lands on, and whether a big unit grew), then bubble any growth into
// larger units by probing thresholds through the RelativeOps adapter.

function nudgeRelativeDuration(
  sign: NumberSign,
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: bigint,
  _largestUnit: Unit,
  smallestUnit: Unit, // always >Day
  roundingInc: number,
  roundingMode: RoundingModeEnum,
  relativeOps: RelativeOps,
): [
  durationFields: DurationFields,
  movedEpochNano: bigint,
  expandedBigUnit: boolean, // grew year/month/week/day?
] {
  const smallestUnitFieldName = durationFieldNamesAsc[smallestUnit]
  const baseDurationFields = clearDurationFields(smallestUnit, durationFields)

  // convert days to whole weeks
  if (smallestUnit === Unit.Week) {
    // Leftover days are already zeroed in baseDurationFields and reappear
    // as the nudge-window fraction below.
    durationFields = {
      ...durationFields,
      weeks: durationFields.weeks + Math.trunc(durationFields.days / 7),
    }
  }

  const truncedVal =
    divTrunc(durationFields[smallestUnitFieldName], roundingInc) * roundingInc

  baseDurationFields[smallestUnitFieldName] = truncedVal

  const nudgeWindow = clampRelativeDuration(
    baseDurationFields,
    smallestUnit, // clampUnit
    roundingInc * sign, // clampDistance
    relativeOps,
    endEpochNano,
  )
  const epochNano0 = nudgeWindow.epochNano0
  const epochNano1 = nudgeWindow.epochNano1

  // usually between 0-1, however can be higher when weeks aren't bounded by months
  const frac = computeEpochNanoFrac(endEpochNano, epochNano0, epochNano1)

  const windowStartVal = nudgeWindow.startDurationFields[smallestUnitFieldName]
  const windowEndVal = nudgeWindow.endDurationFields[smallestUnitFieldName]
  const exactVal = windowStartVal + frac * sign * roundingInc
  const roundedVal = roundNumberToInc(exactVal, roundingInc, roundingMode)
  const roundedToEnd = roundedVal === windowEndVal

  baseDurationFields[smallestUnitFieldName] = roundedVal

  return [
    baseDurationFields,
    roundedToEnd ? epochNano1 : epochNano0,
    nudgeWindow.shifted || roundedToEnd, // guaranteed big unit because of big smallestUnit
  ]
}

/*
Handles DST edge cases
ONLY time
*/
function nudgeZonedTimeDuration(
  sign: NumberSign,
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: bigint, // original destination, then rewritten to the nudged instant
  _largestUnit: Unit,
  smallestUnit: TimeUnit, // always <Day
  roundingInc: number, // always >=Day
  roundingMode: RoundingModeEnum,
  relativeOps: RelativeOps,
): [
  nudgedDurationFields: DurationFields,
  nudgedEpochNano: bigint,
  expandedBigUnit: boolean, // grew year/month/week/day?
] {
  const timeNano = Number(durationTimeToBigNano(durationFields))
  const nanoInc = computeNanoInc(smallestUnit, roundingInc)
  let roundedTimeNano = roundNumberToInc(timeNano, nanoInc, roundingMode)

  const dayWindow = clampRelativeDuration(
    { ...durationFields, ...durationTimeFieldDefaults },
    Unit.Day, // clampUnit
    sign, // clampDistance
    relativeOps,
    endEpochNano,
  )
  const dayEpochNano0 = dayWindow.epochNano0
  const dayEpochNano1 = dayWindow.epochNano1

  const daySpanNano = Number(dayEpochNano1 - dayEpochNano0)
  const beyondDayNano = roundedTimeNano - daySpanNano
  let dayDelta = 0

  // rounded-time at start-of next day or beyond?
  // if so, rerun rounding with origin as next day
  if (!beyondDayNano || Math.sign(beyondDayNano) === sign) {
    dayDelta += sign
    roundedTimeNano = roundNumberToInc(beyondDayNano, nanoInc, roundingMode)
    endEpochNano = dayEpochNano1 + BigInt(roundedTimeNano)
  } else {
    endEpochNano = dayEpochNano0 + BigInt(roundedTimeNano)
  }

  const durationTimeFields = nanoToDurationTimeFields(roundedTimeNano)

  const nudgedDurationFields = {
    ...durationFields,
    ...durationTimeFields,
    days: durationFields.days + dayDelta,
  }

  return [nudgedDurationFields, endEpochNano, Boolean(dayDelta)]
}

function nudgeDayTimeDuration(
  sign: NumberSign,
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: bigint, // destination before applying the rounding delta
  largestUnit: DayTimeUnit,
  smallestUnit: DayTimeUnit, // always <=Day
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): [
  nudgedDurationFields: DurationFields,
  nudgedEpochNano: bigint,
  expandedBigUnit: boolean, // grew year/month/week/day?
] {
  const bigNano = durationDayTimeToBigNano(durationFields)
  const roundedBigNano = roundBigNanoToInc(
    bigNano,
    computeBigNanoInc(smallestUnit, roundingInc),
    roundingMode,
  )
  const nanoDiff = roundedBigNano - bigNano

  // Did the # of days expand? [0] is bigint's day-unit
  const expandedBigUnit =
    Math.sign(
      Number(roundedBigNano / bigNanoInUtcDay) -
        Number(bigNano / bigNanoInUtcDay),
    ) === sign

  // Convert back to day-and-time field
  const roundedDayTimeFields = nanoToDurationDayTimeFields(
    roundedBigNano,
    Math.min(largestUnit, Unit.Day), // force to Day or smaller
  )
  const nudgedDurationFields = {
    ...durationFields,
    ...roundedDayTimeFields,
  }

  return [nudgedDurationFields, endEpochNano + nanoDiff, expandedBigUnit]
}

function bubbleRelativeDuration(
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: bigint,
  largestUnit: Unit,
  smallestUnit: Unit, // guaranteed Day/Week/Month/Year
  sign: NumberSign,
  relativeOps: RelativeOps,
): DurationFields {
  for (
    let currentUnit: Unit = smallestUnit + 1;
    currentUnit <= largestUnit;
    currentUnit++
  ) {
    // if balancing day->month->year, skip weeks
    if (currentUnit === Unit.Week && largestUnit !== Unit.Week) {
      continue
    }

    const baseDurationFields = clearDurationFields(currentUnit, durationFields)
    baseDurationFields[durationFieldNamesAsc[currentUnit]] += sign

    const thresholdEpochNano = moveRelativeMarkerToEpochNano(
      relativeOps,
      baseDurationFields,
    )
    const thresholdCompare = compareBigInts(endEpochNano, thresholdEpochNano)

    if (!thresholdCompare || thresholdCompare === sign) {
      durationFields = baseDurationFields
    } else {
      break
    }
  }

  return durationFields
}

// Zoned interval helpers
// -----------------------------------------------------------------------------
// Compute the epoch interval of a local calendar day and choose one of its
// bounds. Shared by the day strategy and the func-API interval rounding.

function computeZonedDayEpochInterval(
  slots: ZonedEpochNanoFields,
): [bigint, bigint] {
  const { timeZone } = slots
  const isoDate = zonedEpochSlotsToIso(slots)
  const isoDateTime0 = combineDateAndTime(isoDate, timeFieldDefaults)
  const isoDateTime1 = combineDateAndTime(
    moveDateByDays(isoDateTime0, 1),
    timeFieldDefaults,
  )

  const epochNano0 = getStartOfDayInstantFor(timeZone, isoDateTime0)
  const epochNano1 = getStartOfDayInstantFor(timeZone, isoDateTime1)
  return [epochNano0, epochNano1]
}

// Select a boundary using the same fraction and rounding rules for all zoned
// calendar intervals. A backwards transition can repeat the next local start. An
// instant in the repeated portion still rounds within its own ISO date, even
// when it is at or after the earlier instant chosen for the next start of day.
function roundZonedEpochToBounds(
  epochNano: bigint,
  epochNano0: bigint,
  epochNano1: bigint,
  roundingMode: RoundingModeEnum,
): bigint {
  const frac = computeEpochNanoFrac(
    epochNano < epochNano1 ? epochNano : epochNano1 - 1n,
    epochNano0,
    epochNano1,
  )
  return roundWithMode(frac, roundingMode) ? epochNano1 : epochNano0
}

// Numeric increment rounding
// -----------------------------------------------------------------------------
// Round Number and bigint nanosecond values to an increment. These accept an
// already-computed increment (see the conversion helpers below), not a unit.
// The bigint variants keep sub-increment remainders exact for large values.
// Instant, offset formatting, and the func API call some of these directly.

/*
Common operation
Always uses halfExpand
*/
export function roundToMinute(offsetNano: number): number {
  return roundNumberToInc(offsetNano, nanoInMinute, RoundingModeEnum.HalfExpand)
}

/*
Rounds an exact nanosecond bigint to an exact bigint increment. The quotient is
truncated toward zero by BigInt division, and the signed remainder decides
whether rounding should move to the adjacent increment. Keeping this in bigint
space avoids losing sub-increment remainders for large durations/epoch values.
*/
export function roundBigNanoToInc(
  bigNano: bigint,
  bigNanoInc: bigint,
  roundingMode: RoundingModeEnum,
): bigint {
  return roundBigNanoToIncWithTail(
    bigNano,
    bigNanoInc,
    roundingMode,
    (bigNano / bigNanoInc) % 2n,
  )
}

export function roundBigNanoToDayOriginInc(
  bigNano: bigint,
  bigNanoInc: bigint,
  roundingMode: RoundingModeEnum,
): bigint {
  const [day, timeNano] = divModFloorBigInt(bigNano, bigNanoInUtcDay)
  const dayOriginNano = day * bigNanoInUtcDay
  const quotientTail = (dayOriginNano / bigNanoInc + timeNano / bigNanoInc) % 2n

  return (
    dayOriginNano +
    roundBigNanoToIncWithTail(timeNano, bigNanoInc, roundingMode, quotientTail)
  )
}

/*
Never receives smallestUnit/roundingIncrement
Use computeNanoInc for that
*/
export function roundNumberToInc(
  num: number,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): number {
  return roundWithMode(num / roundingInc, roundingMode) * roundingInc
}

// quotientTail is the small, Number-safe part of the full quotient that gets
// fed to roundWithMode. Callers compute it before shifting bigNano relative
// to an origin, so halfEven still sees the original quotient parity.
function roundBigNanoToIncWithTail(
  bigNano: bigint,
  bigNanoInc: bigint,
  roundingMode: RoundingModeEnum,
  quotientTail: bigint,
): bigint {
  const quotient = bigNano / bigNanoInc
  const remainder = bigNano % bigNanoInc
  let fraction = 0

  if (remainder) {
    const absRemainder = remainder < 0n ? -remainder : remainder

    fraction = fabricateNearHalfFraction(
      compareBigInts(absRemainder * 2n, bigNanoInc),
      Math.sign(Number(remainder)) as NumberSign,
    )
  }

  const roundedTail = roundWithMode(
    Number(quotientTail) + fraction,
    roundingMode,
  )
  return (quotient - quotientTail + BigInt(roundedTail)) * bigNanoInc
}

// Increment conversion and mode dispatch
// -----------------------------------------------------------------------------
// Convert a unit and increment count to a nanosecond increment, and apply a
// rounding mode to a plain Number. Everything above bottoms out here.

export function computeNanoInc(
  smallestUnit: DayTimeUnit,
  roundingInc: number,
): number {
  return unitNanoMap[smallestUnit] * roundingInc
}

export function computeBigNanoInc(
  smallestUnit: DayTimeUnit,
  roundingInc: number,
): bigint {
  return BigInt(unitNanoMap[smallestUnit]) * BigInt(roundingInc)
}

export function roundWithMode(
  num: number,
  roundingMode: RoundingModeEnum,
): number {
  return roundingModeFuncs[roundingMode](num)
}
