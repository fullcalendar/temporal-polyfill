import type { Temporal } from 'temporal-spec'
import { bigNanoInUtcDay, divideBigNanoToExactNumber } from './bigNano'
import { type CalendarImpl } from './calendarImpl'
import {
  DurationFields,
  clearDurationFields,
  durationFieldDefaults,
  durationFieldNamesAsc,
  durationTimeFieldDefaults,
} from './durationFields'
import {
  computeDurationSign,
  durationDayTimeFieldsToBigNano,
  getMaxDurationUnit,
  nanoToDurationDayTimeFields,
  nanoToDurationTimeFields,
} from './durationMath'
import * as errorMessages from './errorMessages'
import { timeFieldDefaults } from './fieldNames'
import { CalendarDateTimeFields, TimeFields } from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { moveByDays } from './move'
import { roundingModeFuncs } from './optionsConfig'
import { EpochDisambig, OffsetDisambig, RoundingModeEnum } from './optionsModel'
import { refineRoundingOptions } from './optionsRoundingRefine'
import {
  MarkerMoveOps,
  isUniformUnit,
  isZonedEpochSlots,
  moveMarkerToEpochNano,
} from './relativeMath'
import {
  EpochNanoFields,
  ZonedEpochNanoFields,
  createDateTimeSlots,
  createEpochNanoSlots,
  createTimeSlots,
  createZonedEpochNanoSlots,
} from './slots'
import { checkIsoDateTimeInBounds } from './temporalLimits'
import {
  nanoToTimeAndDay,
  timeFieldsToBigNano,
  timeFieldsToNano,
} from './timeFieldMath'
import { TimeZone } from './timeZone'
import {
  getMatchingInstantFor,
  getStartOfDayInstantFor,
  zonedEpochSlotsToIso,
} from './timeZoneMath'
import { clampRelativeDuration, computeEpochNanoFrac } from './total'
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
  compareToHalfFraction,
  divModFloorBigInt,
  divTrunc,
} from './utils'

// High-Level
// -----------------------------------------------------------------------------

export function roundInstant(
  instantSlots: EpochNanoFields,
  options:
    | Temporal.PluralizeUnit<Temporal.TimeUnit>
    | Temporal.RoundingOptions<Temporal.TimeUnit>,
): EpochNanoFields {
  const [smallestUnit, roundingInc, roundingMode] = refineRoundingOptions(
    options,
    Unit.Hour,
    true, // solarMode
  ) as [TimeUnit, number, RoundingModeEnum]
  return roundInstantToUnit(
    instantSlots,
    smallestUnit,
    roundingInc,
    roundingMode,
  )
}

/*
Like roundInstant, but accepts an already-refined smallestUnit/inc/mode
instead of a raw options bag. Lets callers that already hold a separate
smallestUnit (e.g. the funcApi roundTo* helpers) skip synthesizing a fake
options object only to have it re-parsed.
*/
export function roundInstantToUnit(
  instantSlots: EpochNanoFields,
  smallestUnit: TimeUnit,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): EpochNanoFields {
  return createEpochNanoSlots(
    roundBigNanoToUnit(
      instantSlots.epochNanoseconds,
      smallestUnit,
      roundingInc,
      roundingMode,
      true, // useDayOrigin
    ),
  )
}

/*
ONLY day & time
*/
export function roundZonedDateTime(
  slots: ZonedEpochNanoFields & { calendar: CalendarImpl }, // might get returned :(
  options:
    | Temporal.PluralizeUnit<'day' | Temporal.TimeUnit>
    | Temporal.RoundingOptions<'day' | Temporal.TimeUnit>,
): ZonedEpochNanoFields & { calendar: CalendarImpl } {
  const [smallestUnit, roundingInc, roundingMode] = refineRoundingOptions(
    options,
  ) as [DayTimeUnit, number, RoundingModeEnum]
  return roundZonedDateTimeToUnit(
    slots,
    smallestUnit,
    roundingInc,
    roundingMode,
  )
}

/*
Like roundZonedDateTime, but accepts an already-refined smallestUnit/inc/mode
instead of a raw options bag. Lets callers that already hold a separate
smallestUnit (e.g. the funcApi roundTo* helpers) skip synthesizing a fake
options object only to have it re-parsed.
*/
export function roundZonedDateTimeToUnit(
  slots: ZonedEpochNanoFields & { calendar: CalendarImpl }, // might get returned :(
  smallestUnit: DayTimeUnit,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): ZonedEpochNanoFields & { calendar: CalendarImpl } {
  let { epochNanoseconds } = slots
  const { timeZone, calendar } = slots

  if (smallestUnit === Unit.Nanosecond && roundingInc === 1) {
    return slots
  }

  if (smallestUnit === Unit.Day) {
    // No Temporal-bounds check is needed: the whole ISO day around a valid ZDT
    // is representable. Still verify custom time-zone protocol results below.
    const isoDateTime = zonedEpochSlotsToIso(slots, timeZone)
    const isoFields0 = combineDateAndTime(isoDateTime, timeFieldDefaults)
    const isoFields1 = moveByDays(isoFields0, 1) as CalendarDateTimeFields
    const epochNano0 = getStartOfDayInstantFor(timeZone, isoFields0)
    const epochNano1 = getStartOfDayInstantFor(timeZone, isoFields1)
    if (epochNanoseconds < epochNano0 || epochNanoseconds > epochNano1) {
      throw new RangeError(errorMessages.invalidProtocolResults)
    }
    epochNanoseconds = roundWithMode(
      computeEpochNanoFrac(epochNanoseconds, epochNano0, epochNano1),
      roundingMode,
    )
      ? epochNano1
      : epochNano0
  } else {
    const isoDateTime = zonedEpochSlotsToIso(slots, timeZone)
    const offsetNano = isoDateTime.offsetNanoseconds

    const roundedIsoDateTime = roundDateTimeToNano(
      isoDateTime,
      computeNanoInc(smallestUnit, roundingInc),
      roundingMode,
    )
    epochNanoseconds = getMatchingInstantFor(
      timeZone,
      roundedIsoDateTime,
      offsetNano,
      OffsetDisambig.Prefer, // keep old offsetNano if possible
      EpochDisambig.Compat,
      true, // fuzzy
    )
  }

  return createZonedEpochNanoSlots(epochNanoseconds, timeZone, calendar)
}

/*
ONLY day & time
*/
export function roundPlainDateTime(
  slots: CalendarDateTimeFields & { calendar: CalendarImpl },
  options:
    | Temporal.PluralizeUnit<'day' | Temporal.TimeUnit>
    | Temporal.RoundingOptions<'day' | Temporal.TimeUnit>,
): CalendarDateTimeFields & { calendar: CalendarImpl } {
  const [smallestUnit, roundingInc, roundingMode] = refineRoundingOptions(
    options,
  ) as [DayTimeUnit, number, RoundingModeEnum]
  return roundPlainDateTimeToUnit(
    slots,
    smallestUnit,
    roundingInc,
    roundingMode,
  )
}

/*
Like roundPlainDateTime, but accepts an already-refined smallestUnit/inc/mode
instead of a raw options bag. Lets callers that already hold a separate
smallestUnit (e.g. the funcApi roundTo* helpers) skip synthesizing a fake
options object only to have it re-parsed.
*/
export function roundPlainDateTimeToUnit(
  slots: CalendarDateTimeFields & { calendar: CalendarImpl },
  smallestUnit: DayTimeUnit,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): CalendarDateTimeFields & { calendar: CalendarImpl } {
  const roundedIsoDateTime = roundDateTimeToNano(
    slots,
    computeNanoInc(smallestUnit, roundingInc),
    roundingMode,
  )
  return createDateTimeSlots(roundedIsoDateTime, slots.calendar)
}

export function roundPlainTime(
  slots: TimeFields,
  options:
    | Temporal.PluralizeUnit<Temporal.TimeUnit>
    | Temporal.RoundingOptions<Temporal.TimeUnit>,
): TimeFields {
  const [smallestUnit, roundingInc, roundingMode] = refineRoundingOptions(
    options,
    Unit.Hour,
  ) as [TimeUnit, number, RoundingModeEnum]
  return roundPlainTimeToUnit(slots, smallestUnit, roundingInc, roundingMode)
}

/*
Like roundPlainTime, but accepts an already-refined smallestUnit/inc/mode
instead of a raw options bag. Lets callers that already hold a separate
smallestUnit (e.g. the funcApi roundTo* helpers) skip synthesizing a fake
options object only to have it re-parsed.
*/
export function roundPlainTimeToUnit(
  slots: TimeFields,
  smallestUnit: TimeUnit,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): TimeFields {
  const roundedTimeFields = roundTimeToNano(
    slots,
    computeNanoInc(smallestUnit, roundingInc),
    roundingMode,
  )[0]
  return createTimeSlots(roundedTimeFields)
}

// Zoned Utils
// -----------------------------------------------------------------------------

export function computeZonedHoursInDay(
  slots: ZonedEpochNanoFields & { calendar: CalendarImpl },
): number {
  const { timeZone } = slots
  const isoDate = zonedEpochSlotsToIso(slots, timeZone)
  const isoFields0 = combineDateAndTime(isoDate, timeFieldDefaults)
  const isoFields1 = moveByDays(isoFields0, 1) as CalendarDateTimeFields

  const epochNano0 = getStartOfDayInstantFor(timeZone, isoFields0)
  const epochNano1 = getStartOfDayInstantFor(timeZone, isoFields1)

  const hoursExact = divideBigNanoToExactNumber(
    epochNano1 - epochNano0,
    nanoInHour,
  )

  if (hoursExact <= 0) {
    throw new RangeError(errorMessages.invalidProtocolResults)
  }

  return hoursExact
}

export function computeZonedStartOfDay(
  slots: ZonedEpochNanoFields & { calendar: CalendarImpl },
): ZonedEpochNanoFields & { calendar: CalendarImpl } {
  const { timeZone, calendar } = slots
  const isoDateTime = zonedEpochSlotsToIso(slots, timeZone)
  const epochNano1 = getStartOfDayInstantFor(
    timeZone,
    combineDateAndTime(isoDateTime, timeFieldDefaults),
  )
  // nudging within-day guarantees in-bounds
  return createZonedEpochNanoSlots(epochNano1, timeZone, calendar)
}

/*
For year/month/week/day only
*/
export function alignZonedEpoch(
  computeAlignment: (
    slots: CalendarDateTimeFields & { calendar: CalendarImpl },
  ) => CalendarDateTimeFields,
  timeZone: TimeZone,
  slots: ZonedEpochNanoFields & { calendar: CalendarImpl },
): bigint {
  const isoDateTime = zonedEpochSlotsToIso(slots, timeZone)
  const isoFields1 = computeAlignment(isoDateTime)
  const epochNano1 = getStartOfDayInstantFor(timeZone, isoFields1)
  return epochNano1
}

/*
For year/month/week/day only
*/
export function roundZonedEpochToInterval(
  computeInterval: (
    slots: CalendarDateTimeFields & { calendar: CalendarImpl },
  ) => IsoDateTimeInterval,
  timeZone: TimeZone,
  slots: ZonedEpochNanoFields & { calendar: CalendarImpl },
  roundingMode: RoundingModeEnum,
): bigint {
  const isoSlots = zonedEpochSlotsToIso(slots, timeZone)
  const [isoFields0, isoFields1] = computeInterval(isoSlots)

  const epochNano = slots.epochNanoseconds
  const epochNano0 = getStartOfDayInstantFor(timeZone, isoFields0)
  const epochNano1 = getStartOfDayInstantFor(timeZone, isoFields1)

  if (epochNano < epochNano0 || epochNano > epochNano1) {
    throw new RangeError(errorMessages.invalidProtocolResults)
  }

  const frac = computeEpochNanoFrac(epochNano, epochNano0, epochNano1)
  const grow = roundWithMode(frac, roundingMode)
  const epochNanoRounded = grow ? epochNano1 : epochNano0
  return epochNanoRounded
}

// Rounding Time-based Units
// -----------------------------------------------------------------------------

export function roundDateTimeToNano(
  isoDateTime: CalendarDateTimeFields,
  nanoInc: number,
  roundingMode: RoundingModeEnum,
): CalendarDateTimeFields {
  // Time rounding can carry into the neighboring ISO date. Keep the original
  // date and time together here so the day delta is applied to the same
  // wall-clock value that produced the rounded time.
  const [roundedTimeFields, dayDelta] = roundTimeToNano(
    isoDateTime,
    nanoInc,
    roundingMode,
  )

  const roundedIsoDate = moveByDays(isoDateTime, dayDelta)
  const roundedIsoDateTime = combineDateAndTime(
    roundedIsoDate,
    roundedTimeFields,
  )
  checkIsoDateTimeInBounds(roundedIsoDateTime)
  return roundedIsoDateTime
}

export function roundTimeToNano(
  timeFields: TimeFields,
  nanoInc: number,
  roundingMode: RoundingModeEnum,
): [TimeFields, number] {
  return nanoToTimeAndDay(
    roundNumberToInc(timeFieldsToNano(timeFields), nanoInc, roundingMode),
  )
}

/*
Common operation
Always uses halfExpand
*/
export function roundToMinute(offsetNano: number): number {
  return roundNumberToInc(offsetNano, nanoInMinute, RoundingModeEnum.HalfExpand)
}

export function computeNanoInc(
  smallestUnit: DayTimeUnit,
  roundingInc: number,
): number {
  return unitNanoMap[smallestUnit] * roundingInc
}

// Interval / Floor Funcs
// -----------------------------------------------------------------------------

export type IsoDateTimeInterval = [
  CalendarDateTimeFields,
  CalendarDateTimeFields,
]

// for date-times
// to convert date -> date-time, merge the date fields with timeFieldDefaults.
export function computeDayFloor(
  slots: CalendarDateTimeFields,
): CalendarDateTimeFields {
  return combineDateAndTime(slots, timeFieldDefaults)
}

// Duration
// -----------------------------------------------------------------------------

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
  const bigNano = durationDayTimeFieldsToBigNano(durationFields)
  const roundedBigNano = roundBigNanoToInc(
    bigNano,
    BigInt(nanoInc),
    roundingMode,
  )
  return nanoToDurationDayTimeFields(roundedBigNano, maxUnit)
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
  const bigNano = durationDayTimeFieldsToBigNano(durationFields)
  const roundedBigNano = roundBigNanoToUnit(
    bigNano,
    smallestUnit,
    roundingInc,
    roundingMode,
  )
  return {
    ...durationFieldDefaults,
    ...nanoToDurationDayTimeFields(roundedBigNano, largestUnit),
  }
}

export function roundRelativeDuration(
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: bigint,
  largestUnit: Unit,
  smallestUnit: Unit,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
  markerMoveOps: MarkerMoveOps,
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
    !isUniformUnit(smallestUnit, markerMoveOps.marker)
      ? nudgeRelativeDuration
      : isZonedEpochSlots(markerMoveOps.marker) &&
          smallestUnit < Unit.Day &&
          largestUnit >= Unit.Day
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
    markerMoveOps,
  )

  // grew a day/week/month/year?
  if (grewBigUnit && smallestUnit !== Unit.Week) {
    roundedDurationFields = bubbleRelativeDuration(
      roundedDurationFields,
      roundedEpochNano,
      largestUnit,
      Math.max(Unit.Day, smallestUnit), // force to Day or larger
      sign,
      markerMoveOps,
    )
  }

  return roundedDurationFields
}

// Rounding Numbers
// -----------------------------------------------------------------------------

export function roundBigNanoToUnit(
  bigNano: bigint,
  smallestUnit: DayTimeUnit,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
  useDayOrigin?: boolean,
): bigint {
  const bigNanoInc = BigInt(unitNanoMap[smallestUnit]) * BigInt(roundingInc)
  const roundFunc = useDayOrigin
    ? roundBigNanoToDayOriginInc
    : roundBigNanoToInc

  return roundFunc(bigNano, bigNanoInc, roundingMode)
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

    // Precise way of determining before/on/after half
    const halfCompare = compareBigInts(absRemainder * 2n, bigNanoInc)

    fraction = compareToHalfFraction(
      halfCompare,
      Math.sign(Number(remainder)) as NumberSign,
    )
  }

  const roundedTail = roundWithMode(
    Number(quotientTail) + fraction,
    roundingMode,
  )
  return (quotient - quotientTail + BigInt(roundedTail)) * bigNanoInc
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

export function roundWithMode(
  num: number,
  roundingMode: RoundingModeEnum,
): number {
  return roundingModeFuncs[roundingMode](num)
}

// Nudge
// -----------------------------------------------------------------------------
/*
These functions actually do the heavy-lifting of rounding to a higher/lower marker,
and return the (day) delta. Also return the (potentially) unbalanced new duration.
*/

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
  const bigNano = durationDayTimeFieldsToBigNano(durationFields)
  const roundedBigNano = roundBigNanoToUnit(
    bigNano,
    smallestUnit,
    roundingInc,
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
  markerMoveOps: MarkerMoveOps,
): [
  nudgedDurationFields: DurationFields,
  nudgedEpochNano: bigint,
  expandedBigUnit: boolean, // grew year/month/week/day?
] {
  const timeNano = Number(timeFieldsToBigNano(durationFields))
  const nanoInc = computeNanoInc(smallestUnit, roundingInc)
  let roundedTimeNano = roundNumberToInc(timeNano, nanoInc, roundingMode)

  const dayWindow = clampRelativeDuration(
    { ...durationFields, ...durationTimeFieldDefaults },
    Unit.Day, // clampUnit
    sign, // clampDistance
    markerMoveOps,
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

function nudgeRelativeDuration(
  sign: NumberSign,
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: bigint,
  _largestUnit: Unit,
  smallestUnit: Unit, // always >Day
  roundingInc: number,
  roundingMode: RoundingModeEnum,
  markerMoveOps: MarkerMoveOps,
): [
  durationFields: DurationFields,
  movedEpochNano: bigint,
  expandedBigUnit: boolean, // grew year/month/week/day?
] {
  const smallestUnitFieldName = durationFieldNamesAsc[smallestUnit]
  const baseDurationFields = clearDurationFields(smallestUnit, durationFields)

  // convert days to whole weeks
  if (smallestUnit === Unit.Week) {
    // HACK to assume 7 days in a week. Works okay for now since applies to all current calendars.
    // Necessary because week nudging works from duration fields; the marker
    // context gives us movement/epoch math but not calendar-specific week data.
    // https://github.com/tc39/proposal-temporal/issues/2837
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
    markerMoveOps,
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

// Bubbling
// (for when larger units might bubble up)
// -----------------------------------------------------------------------------

function bubbleRelativeDuration(
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: bigint,
  largestUnit: Unit,
  smallestUnit: Unit, // guaranteed Day/Week/Month/Year
  sign: NumberSign,
  markerMoveOps: MarkerMoveOps,
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

    const thresholdEpochNano = moveMarkerToEpochNano(
      markerMoveOps,
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
