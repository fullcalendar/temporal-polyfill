import {
  BigNano,
  addBigNanos,
  bigNanoToExactDays,
  bigNanoToNumber,
  compareBigNanos,
  createBigNano,
  diffBigNanos,
  isBigNanoOutside,
  moveBigNano,
} from './bigNano'
import {
  DurationFields,
  clearDurationFields,
  durationFieldDefaults,
  durationFieldNamesAsc,
  durationTimeFieldDefaults,
} from './durationFields'
import {
  computeDurationSign,
  durationFieldsToBigNano,
  getMaxDurationUnit,
  nanoToDurationDayTimeFields,
  nanoToDurationTimeFields,
} from './durationMath'
import * as errorMessages from './errorMessages'
import { timeFieldDefaults } from './fieldNames'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { moveByDays } from './move'
import { roundingModeFuncs } from './optionsConfig'
import { EpochDisambig, OffsetDisambig, RoundingMode } from './optionsModel'
import { RoundingOptions } from './optionsModel'
import { refineRoundingOptions } from './optionsRoundingRefine'
import {
  MarkerMath,
  isUniformUnit,
  isZonedEpochSlots,
  moveMarkerToEpochNano,
} from './relativeMath'
import {
  AbstractDateTimeSlots,
  InstantSlots,
  PlainDateTimeSlots,
  PlainTimeSlots,
  ZonedDateTimeSlots,
  ZonedEpochSlots,
  createInstantSlots,
  createPlainDateTimeSlots,
  createPlainTimeSlots,
  createZonedDateTimeSlots,
} from './slots'
import {
  checkIsoDateTimeInBounds,
  nanoToTimeAndDay,
  timeFieldsToNano,
} from './timeMath'
import { TimeZoneImpl, queryTimeZone } from './timeZoneImpl'
import {
  getMatchingInstantFor,
  getStartOfDayInstantFor,
  zonedEpochSlotsToIso,
} from './timeZoneMath'
import { clampRelativeDuration, computeEpochNanoFrac } from './total'
import {
  DayTimeUnit,
  DayTimeUnitName,
  TimeUnit,
  TimeUnitName,
  Unit,
  nanoInHour,
  nanoInMinute,
  nanoInUtcDay,
  unitNanoMap,
} from './units'
import { NumberSign, divModFloor, divTrunc } from './utils'

// High-Level
// -----------------------------------------------------------------------------

export function roundInstant(
  instantSlots: InstantSlots,
  options: TimeUnitName | RoundingOptions<TimeUnitName>,
): InstantSlots {
  const [smallestUnit, roundingInc, roundingMode] = refineRoundingOptions(
    options,
    Unit.Hour,
    true, // solarMode
  )

  return createInstantSlots(
    roundBigNano(
      instantSlots.epochNanoseconds,
      smallestUnit as TimeUnit,
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
  slots: ZonedDateTimeSlots,
  options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>,
): ZonedDateTimeSlots {
  let { epochNanoseconds, timeZoneId, calendarId } = slots
  const [smallestUnit, roundingInc, roundingMode] =
    refineRoundingOptions(options)

  if (smallestUnit === Unit.Nanosecond && roundingInc === 1) {
    return slots
  }

  const timeZoneImpl = queryTimeZone(timeZoneId)

  if (smallestUnit === Unit.Day) {
    // no need for checking in-bounds. entire day of valid zdt is valid
    epochNanoseconds = roundZonedEpochToInterval(
      computeDayInterval,
      timeZoneImpl,
      slots,
      roundingMode,
    )
  } else {
    const isoDateTime = zonedEpochSlotsToIso(slots, timeZoneImpl)
    const offsetNano = isoDateTime.offsetNanoseconds

    const roundedIsoDateTime = roundDateTimeToNano(
      isoDateTime,
      computeNanoInc(smallestUnit as DayTimeUnit, roundingInc),
      roundingMode,
    )
    epochNanoseconds = getMatchingInstantFor(
      timeZoneImpl,
      roundedIsoDateTime,
      offsetNano,
      OffsetDisambig.Prefer, // keep old offsetNano if possible
      EpochDisambig.Compat,
      true, // fuzzy
    )
  }

  return createZonedDateTimeSlots(epochNanoseconds, timeZoneId, calendarId)
}

/*
ONLY day & time
*/
export function roundPlainDateTime(
  slots: PlainDateTimeSlots,
  options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>,
): PlainDateTimeSlots {
  const [smallestUnit, roundingInc, roundingMode] = refineRoundingOptions(
    options,
  ) as [DayTimeUnit, number, RoundingMode]
  const roundedIsoDateTime = roundDateTimeToNano(
    slots,
    computeNanoInc(smallestUnit, roundingInc),
    roundingMode,
  )
  return createPlainDateTimeSlots(roundedIsoDateTime, slots.calendarId)
}

export function roundPlainTime(
  slots: PlainTimeSlots,
  options: TimeUnitName | RoundingOptions<TimeUnitName>,
): PlainTimeSlots {
  const [smallestUnit, roundingInc, roundingMode] = refineRoundingOptions(
    options,
    Unit.Hour,
  ) as [TimeUnit, number, RoundingMode]
  const roundedTimeFields = roundTimeToNano(
    slots,
    computeNanoInc(smallestUnit, roundingInc),
    roundingMode,
  )[0]
  return createPlainTimeSlots(roundedTimeFields)
}

// Zoned Utils
// -----------------------------------------------------------------------------

export function computeZonedHoursInDay(slots: ZonedDateTimeSlots): number {
  const timeZoneImpl = queryTimeZone(slots.timeZoneId)

  const isoDate = zonedEpochSlotsToIso(slots, timeZoneImpl)
  const [isoFields0, isoFields1] = computeDayInterval(isoDate)

  const epochNano0 = getStartOfDayInstantFor(timeZoneImpl, isoFields0)
  const epochNano1 = getStartOfDayInstantFor(timeZoneImpl, isoFields1)

  const hoursExact = bigNanoToNumber(
    diffBigNanos(epochNano0, epochNano1),
    nanoInHour,
    true, // exact
  )

  if (hoursExact <= 0) {
    throw new RangeError(errorMessages.invalidProtocolResults)
  }

  return hoursExact
}

export function computeZonedStartOfDay(
  slots: ZonedDateTimeSlots,
): ZonedDateTimeSlots {
  const { timeZoneId, calendarId } = slots
  const timeZoneImpl = queryTimeZone(timeZoneId)
  const epochNano1 = alignZonedEpoch(computeDayFloor, timeZoneImpl, slots)
  // nudging within-day guarantees in-bounds
  return createZonedDateTimeSlots(epochNano1, timeZoneId, calendarId)
}

/*
For year/month/week/day only
*/
export function alignZonedEpoch(
  computeAlignment: (slots: AbstractDateTimeSlots) => CalendarDateTimeFields,
  timeZoneImpl: TimeZoneImpl,
  slots: ZonedDateTimeSlots,
): BigNano {
  const isoDateTime = zonedEpochSlotsToIso(slots, timeZoneImpl)
  const isoFields1 = computeAlignment(isoDateTime)
  const epochNano1 = getStartOfDayInstantFor(timeZoneImpl, isoFields1)
  return epochNano1
}

/*
For year/month/week/day only
*/
export function roundZonedEpochToInterval(
  computeInterval: (slots: AbstractDateTimeSlots) => IsoDateTimeInterval,
  timeZoneImpl: TimeZoneImpl,
  slots: ZonedEpochSlots,
  roundingMode: RoundingMode,
): BigNano {
  const isoSlots = zonedEpochSlotsToIso(slots, timeZoneImpl)
  const [isoFields0, isoFields1] = computeInterval(isoSlots)

  const epochNano = slots.epochNanoseconds
  const epochNano0 = getStartOfDayInstantFor(timeZoneImpl, isoFields0)
  const epochNano1 = getStartOfDayInstantFor(timeZoneImpl, isoFields1)

  if (isBigNanoOutside(epochNano, epochNano0, epochNano1)) {
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
  roundingMode: RoundingMode,
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
  roundingMode: RoundingMode,
): [TimeFields, number] {
  return nanoToTimeAndDay(
    roundByInc(timeFieldsToNano(timeFields), nanoInc, roundingMode),
  )
}

/*
Common operation
Always uses halfExpand
*/
export function roundToMinute(offsetNano: number): number {
  return roundByInc(offsetNano, nanoInMinute, RoundingMode.HalfExpand)
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

function computeDayInterval(isoDate: CalendarDateFields): IsoDateTimeInterval {
  const isoFields0 = combineDateAndTime(isoDate, timeFieldDefaults)
  const isoFields1 = combineDateAndTime(
    moveByDays(isoFields0, 1),
    timeFieldDefaults,
  )
  return [isoFields0, isoFields1]
}

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
  roundingMode: RoundingMode,
): Partial<DurationFields> {
  const maxUnit = Math.min(getMaxDurationUnit(durationFields), Unit.Day) // force <= Day
  const bigNano = durationFieldsToBigNano(durationFields, maxUnit)
  const roundedBigNano = roundBigNanoByInc(bigNano, nanoInc, roundingMode)
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
  roundingMode: RoundingMode,
): DurationFields {
  const bigNano = durationFieldsToBigNano(durationFields)
  const roundedBigNano = roundBigNano(
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
  endEpochNano: BigNano,
  largestUnit: Unit,
  smallestUnit: Unit,
  roundingInc: number,
  roundingMode: RoundingMode,
  markerMath: MarkerMath,
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
    !isUniformUnit(smallestUnit, markerMath.marker)
      ? nudgeRelativeDuration
      : isZonedEpochSlots(markerMath.marker) &&
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
    markerMath,
  )

  // grew a day/week/month/year?
  if (grewBigUnit && smallestUnit !== Unit.Week) {
    roundedDurationFields = bubbleRelativeDuration(
      roundedDurationFields,
      roundedEpochNano,
      largestUnit,
      Math.max(Unit.Day, smallestUnit), // force to Day or larger
      sign,
      markerMath,
    )
  }

  return roundedDurationFields
}

// Rounding Numbers
// -----------------------------------------------------------------------------

export function roundBigNano(
  bigNano: BigNano,
  smallestUnit: DayTimeUnit,
  roundingInc: number,
  roundingMode: RoundingMode,
  useDayOrigin?: boolean,
): BigNano {
  if (smallestUnit === Unit.Day) {
    const daysExact = bigNanoToExactDays(bigNano)
    const daysRounded = roundByInc(daysExact, roundingInc, roundingMode)
    return [daysRounded, 0]
  }

  return roundBigNanoByInc(
    bigNano,
    computeNanoInc(smallestUnit, roundingInc),
    roundingMode,
    useDayOrigin,
  )
}

export function roundBigNanoByInc(
  bigNano: BigNano,
  nanoInc: number, // REQUIRED: a single day must be divisible by this!
  roundingMode: RoundingMode,
  useDayOrigin?: boolean,
): BigNano {
  let [days, timeNano] = bigNano

  // consider the start-of-day the origin?
  // convert to start-of-day and time-of-day
  if (useDayOrigin && timeNano < 0) {
    timeNano += nanoInUtcDay
    days -= 1
  }

  // Official proposal-temporal's TimeDuration.round() keeps one totalNs BigInt
  // and tests quotient parity for half-even ties. In this split [days, timeNano]
  // representation, fold only an odd day into the rounded remainder so quotient
  // parity sees total duration, while other modes preserve the day-origin
  // behavior used by Instant rounding.
  let baseDays = days
  if (roundingMode === RoundingMode.HalfEven) {
    baseDays = divTrunc(days, 2) * 2
    timeNano += (days - baseDays) * nanoInUtcDay
  }

  const roundedTimeNano = roundByInc(timeNano, nanoInc, roundingMode)

  const [dayDelta, finalTimeNano] = divModFloor(roundedTimeNano, nanoInUtcDay)
  return createBigNano(baseDays + dayDelta, finalTimeNano)
}

/*
Never receives smallestUnit/roundingIncrement
Use computeNanoInc for that
*/
export function roundByInc(
  num: number,
  inc: number,
  roundingMode: RoundingMode,
): number {
  return roundWithMode(num / inc, roundingMode) * inc
}

export function roundWithMode(num: number, roundingMode: RoundingMode): number {
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
  endEpochNano: BigNano, // destination before applying the rounding delta
  largestUnit: DayTimeUnit,
  smallestUnit: DayTimeUnit, // always <=Day
  roundingInc: number,
  roundingMode: RoundingMode,
): [
  nudgedDurationFields: DurationFields,
  nudgedEpochNano: BigNano,
  expandedBigUnit: boolean, // grew year/month/week/day?
] {
  const bigNano = durationFieldsToBigNano(durationFields)
  const roundedBigNano = roundBigNano(
    bigNano,
    smallestUnit,
    roundingInc,
    roundingMode,
  )
  const nanoDiff = diffBigNanos(bigNano, roundedBigNano)

  // Did the # of days expand? [0] is BigNano's day-unit
  const expandedBigUnit = Math.sign(roundedBigNano[0] - bigNano[0]) === sign

  // Convert back to day-and-time field
  const roundedDayTimeFields = nanoToDurationDayTimeFields(
    roundedBigNano,
    Math.min(largestUnit, Unit.Day), // force to Day or smaller
  )
  const nudgedDurationFields = {
    ...durationFields,
    ...roundedDayTimeFields,
  }

  return [
    nudgedDurationFields,
    addBigNanos(endEpochNano, nanoDiff),
    expandedBigUnit,
  ]
}

/*
Handles DST edge cases
ONLY time
*/
function nudgeZonedTimeDuration(
  sign: NumberSign,
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: BigNano, // original destination, then rewritten to the nudged instant
  _largestUnit: Unit,
  smallestUnit: TimeUnit, // always <Day
  roundingInc: number, // always >=Day
  roundingMode: RoundingMode,
  markerMath: MarkerMath,
): [
  nudgedDurationFields: DurationFields,
  nudgedEpochNano: BigNano,
  expandedBigUnit: boolean, // grew year/month/week/day?
] {
  const timeNano = bigNanoToNumber(
    durationFieldsToBigNano(durationFields, Unit.Hour),
  )
  const nanoInc = computeNanoInc(smallestUnit, roundingInc)
  let roundedTimeNano = roundByInc(timeNano, nanoInc, roundingMode)

  const dayWindow = clampRelativeDuration(
    { ...durationFields, ...durationTimeFieldDefaults },
    Unit.Day, // clampUnit
    sign, // clampDistance
    markerMath,
    endEpochNano,
  )
  const dayEpochNano0 = dayWindow.epochNano0
  const dayEpochNano1 = dayWindow.epochNano1

  const daySpanNano = bigNanoToNumber(
    diffBigNanos(dayEpochNano0, dayEpochNano1),
  )
  const beyondDayNano = roundedTimeNano - daySpanNano
  let dayDelta = 0

  // rounded-time at start-of next day or beyond?
  // if so, rerun rounding with origin as next day
  if (!beyondDayNano || Math.sign(beyondDayNano) === sign) {
    dayDelta += sign
    roundedTimeNano = roundByInc(beyondDayNano, nanoInc, roundingMode)
    endEpochNano = moveBigNano(dayEpochNano1, roundedTimeNano)
  } else {
    endEpochNano = moveBigNano(dayEpochNano0, roundedTimeNano)
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
  endEpochNano: BigNano,
  _largestUnit: Unit,
  smallestUnit: Unit, // always >Day
  roundingInc: number,
  roundingMode: RoundingMode,
  markerMath: MarkerMath,
): [
  durationFields: DurationFields,
  movedEpochNano: BigNano,
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
    markerMath,
    endEpochNano,
  )
  const epochNano0 = nudgeWindow.epochNano0
  const epochNano1 = nudgeWindow.epochNano1

  // usually between 0-1, however can be higher when weeks aren't bounded by months
  const frac = computeEpochNanoFrac(endEpochNano, epochNano0, epochNano1)

  const windowStartVal = nudgeWindow.startDurationFields[smallestUnitFieldName]
  const windowEndVal = nudgeWindow.endDurationFields[smallestUnitFieldName]
  const exactVal = windowStartVal + frac * sign * roundingInc
  const roundedVal = roundByInc(exactVal, roundingInc, roundingMode)
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
  endEpochNano: BigNano,
  largestUnit: Unit,
  smallestUnit: Unit, // guaranteed Day/Week/Month/Year
  sign: NumberSign,
  markerMath: MarkerMath,
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
      markerMath,
      baseDurationFields,
    )
    const thresholdCompare = compareBigNanos(endEpochNano, thresholdEpochNano)

    if (!thresholdCompare || thresholdCompare === sign) {
      durationFields = baseDurationFields
    } else {
      break
    }
  }

  return durationFields
}
