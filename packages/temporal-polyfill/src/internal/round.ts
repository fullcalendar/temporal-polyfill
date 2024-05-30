import {
  BigNano,
  addBigNanos,
  bigNanoOutside,
  bigNanoToExactDays,
  bigNanoToNumber,
  createBigNano,
  diffBigNanos,
  moveBigNano,
} from './bigNano'
import { MoveOps } from './calendarOps'
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
import { IsoDateTimeFields, IsoTimeFields, clearIsoFields } from './isoFields'
import {
  Marker,
  MarkerToEpochNano,
  MoveMarker,
  isUniformUnit,
  isZonedEpochSlots,
} from './markerSystem'
import { moveByDays } from './move'
import {
  EpochDisambig,
  OffsetDisambig,
  RoundingMode,
  roundingModeFuncs,
} from './options'
import { RoundingOptions, refineRoundingOptions } from './optionsRefine'
import {
  DateTimeSlots,
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
  epochNanoToIso,
  isoTimeFieldsToNano,
  nanoToIsoTimeAndDay,
} from './timeMath'
import {
  TimeZoneOps,
  getMatchingInstantFor,
  getSingleInstantFor,
  zonedEpochSlotsToIso,
} from './timeZoneOps'
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
import { divModFloor, divTrunc } from './utils'

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
export function roundZonedDateTime<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  slots: ZonedDateTimeSlots<C, T>,
  options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>,
): ZonedDateTimeSlots<C, T> {
  let { epochNanoseconds, timeZone, calendar } = slots
  const [smallestUnit, roundingInc, roundingMode] =
    refineRoundingOptions(options)

  if (smallestUnit === Unit.Nanosecond && roundingInc === 1) {
    return slots
  }

  const timeZoneOps = getTimeZoneOps(timeZone)

  if (smallestUnit === Unit.Day) {
    // no need for checking in-bounds. entire day of valid zdt is valid
    epochNanoseconds = roundZonedEpochToInterval(
      computeDayInterval,
      timeZoneOps,
      slots,
      roundingMode,
    )
  } else {
    const offsetNano = timeZoneOps.getOffsetNanosecondsFor(epochNanoseconds)
    const isoFields = epochNanoToIso(epochNanoseconds, offsetNano)
    // TODO: ^optimize with zonedEpochSlotsToIso?

    const roundedIsoFields = roundDateTime(
      isoFields,
      smallestUnit as DayTimeUnit,
      roundingInc,
      roundingMode,
    )
    epochNanoseconds = getMatchingInstantFor(
      timeZoneOps,
      roundedIsoFields,
      offsetNano,
      OffsetDisambig.Prefer, // keep old offsetNano if possible
      EpochDisambig.Compat,
      true, // fuzzy
    )
  }

  return createZonedDateTimeSlots(epochNanoseconds, timeZone, calendar)
}

/*
ONLY day & time
*/
export function roundPlainDateTime<C>(
  slots: PlainDateTimeSlots<C>,
  options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>,
): PlainDateTimeSlots<C> {
  const roundedIsoFields = roundDateTime(
    slots,
    ...(refineRoundingOptions(options) as [DayTimeUnit, number, RoundingMode]),
  )
  return createPlainDateTimeSlots(roundedIsoFields, slots.calendar)
}

export function roundPlainTime(
  slots: PlainTimeSlots,
  options: TimeUnitName | RoundingOptions<TimeUnitName>,
): PlainTimeSlots {
  // workaround for https://github.com/swc-project/swc/issues/8806
  const [a, b, c] = refineRoundingOptions(options, Unit.Hour) as [
    TimeUnit,
    number,
    RoundingMode,
  ]
  const roundedIsoFields = roundTime(slots, a, b, c)
  return createPlainTimeSlots(roundedIsoFields)
}

// Zoned Utils
// -----------------------------------------------------------------------------

export function computeZonedHoursInDay<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  slots: ZonedDateTimeSlots<C, T>,
): number {
  const timeZoneOps = getTimeZoneOps(slots.timeZone)

  const isoFields = zonedEpochSlotsToIso(slots, timeZoneOps)
  const [isoFields0, isoFields1] = computeDayInterval(isoFields)

  const epochNano0 = getSingleInstantFor(timeZoneOps, isoFields0)
  const epochNano1 = getSingleInstantFor(timeZoneOps, isoFields1)

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

export function computeZonedStartOfDay<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  slots: ZonedDateTimeSlots<C, T>,
): ZonedDateTimeSlots<C, T> {
  const { timeZone, calendar } = slots
  const timeZoneOps = getTimeZoneOps(timeZone)
  const epochNano1 = alignZonedEpoch(computeDayFloor, timeZoneOps, slots)
  // nudging within-day guarantees in-bounds
  return createZonedDateTimeSlots(epochNano1, timeZone, calendar)
}

/*
For year/month/week/day only
*/
export function alignZonedEpoch<C, T>(
  computeAlignment: (slots: DateTimeSlots<C>) => IsoDateTimeFields,
  timeZoneOps: TimeZoneOps,
  slots: ZonedDateTimeSlots<C, T>,
): BigNano {
  const isoFields = zonedEpochSlotsToIso(slots, timeZoneOps)
  const isoFields1 = computeAlignment(isoFields)
  const epochNano1 = getSingleInstantFor(timeZoneOps, isoFields1)
  return epochNano1
}

/*
For year/month/week/day only
*/
export function roundZonedEpochToInterval<C>(
  computeInterval: (slots: DateTimeSlots<C>) => IsoDateTimeInterval,
  timeZoneOps: TimeZoneOps,
  slots: ZonedEpochSlots<C, unknown>,
  roundingMode: RoundingMode,
): BigNano {
  const isoSlots = zonedEpochSlotsToIso(slots, timeZoneOps)
  const [isoFields0, isoFields1] = computeInterval(isoSlots)

  const epochNano = slots.epochNanoseconds
  const epochNano0 = getSingleInstantFor(timeZoneOps, isoFields0)
  const epochNano1 = getSingleInstantFor(timeZoneOps, isoFields1)

  if (bigNanoOutside(epochNano, epochNano0, epochNano1)) {
    throw new RangeError(errorMessages.invalidProtocolResults)
  }

  const frac = computeEpochNanoFrac(epochNano, epochNano0, epochNano1)
  const grow = roundWithMode(frac, roundingMode)
  const epochNanoRounded = grow ? epochNano1 : epochNano0
  return epochNanoRounded
}

// Rounding Time-based Units
// -----------------------------------------------------------------------------
// TODO: combine with below?

function roundDateTime(
  isoFields: IsoDateTimeFields,
  smallestUnit: DayTimeUnit,
  roundingInc: number,
  roundingMode: RoundingMode,
): IsoDateTimeFields {
  return roundDateTimeToNano(
    isoFields,
    computeNanoInc(smallestUnit, roundingInc),
    roundingMode,
  )
}

export function roundDateTimeToNano(
  isoFields: IsoDateTimeFields,
  nanoInc: number,
  roundingMode: RoundingMode,
): IsoDateTimeFields {
  const [roundedIsoFields, dayDelta] = roundTimeToNano(
    isoFields,
    nanoInc,
    roundingMode,
  )

  return checkIsoDateTimeInBounds({
    ...moveByDays(isoFields, dayDelta),
    ...roundedIsoFields,
  })
}

function roundTime(
  isoFields: IsoTimeFields,
  smallestUnit: TimeUnit,
  roundingInc: number,
  roundingMode: RoundingMode,
): IsoTimeFields {
  return roundTimeToNano(
    isoFields,
    computeNanoInc(smallestUnit, roundingInc),
    roundingMode,
  )[0]
}

export function roundTimeToNano(
  isoFields: IsoTimeFields,
  nanoInc: number,
  roundingMode: RoundingMode,
): [IsoTimeFields, number] {
  return nanoToIsoTimeAndDay(
    roundByInc(isoTimeFieldsToNano(isoFields), nanoInc, roundingMode),
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

export type IsoDateTimeInterval = [IsoDateTimeFields, IsoDateTimeFields]

export function computeDayInterval(
  isoFields: IsoDateTimeFields,
): IsoDateTimeInterval {
  const isoFields0 = computeDayFloor(isoFields)
  const isoFields1 = moveByDays(isoFields0, 1)
  return [isoFields0, isoFields1]
}

export function computeDayFloor(
  isoFields: IsoDateTimeFields,
): IsoDateTimeFields {
  return clearIsoFields(Unit.Day, isoFields)
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

/*
NOTE: caller should short-circuit if !sign
*/
export function roundRelativeDuration(
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: BigNano,
  largestUnit: Unit,
  smallestUnit: Unit,
  roundingInc: number,
  roundingMode: RoundingMode,
  calendarOps: MoveOps,
  marker: Marker,
  markerToEpochNano: MarkerToEpochNano,
  moveMarker: MoveMarker,
): DurationFields {
  if (smallestUnit === Unit.Nanosecond && roundingInc === 1) {
    return durationFields
  }

  const nudgeFunc = (
    !isUniformUnit(smallestUnit, marker)
      ? nudgeRelativeDuration
      : isZonedEpochSlots(marker) && smallestUnit < Unit.Day
        ? nudgeZonedTimeDuration
        : nudgeDayTimeDuration
  ) as typeof nudgeRelativeDuration // most general

  let [roundedDurationFields, roundedEpochNano, grewBigUnit] = nudgeFunc(
    durationFields,
    endEpochNano,
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    calendarOps,
    marker,
    markerToEpochNano,
    moveMarker,
  )

  // grew a day/week/month/year?
  if (grewBigUnit && smallestUnit !== Unit.Week) {
    roundedDurationFields = bubbleRelativeDuration(
      roundedDurationFields,
      roundedEpochNano,
      largestUnit,
      Math.max(Unit.Day, smallestUnit), // force to Day or larger
      calendarOps,
      marker,
      markerToEpochNano,
      moveMarker,
    )
  }

  return roundedDurationFields
}

// Rounding Numbers
// -----------------------------------------------------------------------------
// TODO: merge with above

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

  const [dayDelta, roundedTimeNano] = divModFloor(
    roundByInc(timeNano, nanoInc, roundingMode),
    nanoInUtcDay,
  )

  return createBigNano(days + dayDelta, roundedTimeNano)
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
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: BigNano, // NOT NEEDED, just for adding result to
  largestUnit: DayTimeUnit,
  smallestUnit: DayTimeUnit, // always <=Day
  roundingInc: number,
  roundingMode: RoundingMode,
): [
  nudgedDurationFields: DurationFields,
  nudgedEpochNano: BigNano,
  expandedBigUnit: boolean, // grew year/month/week/day?
] {
  const sign = computeDurationSign(durationFields)
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
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: BigNano, // NOT NEEDED, just for conformance
  _largestUnit: Unit,
  smallestUnit: TimeUnit, // always <Day
  roundingInc: number,
  roundingMode: RoundingMode,
  calendarOps: MoveOps,
  marker: Marker,
  markerToEpochNano: MarkerToEpochNano,
  moveMarker: MoveMarker,
): [
  nudgedDurationFields: DurationFields,
  nudgedEpochNano: BigNano,
  expandedBigUnit: boolean, // grew year/month/week/day?
] {
  const sign = computeDurationSign(durationFields) // TODO: already computed and non-zero?

  // dayDelta ALWAYS zero here because durationFields time-units already balanced up to days
  let [dayDelta, timeNano] = durationFieldsToBigNano(durationFields, Unit.Hour)

  const nanoInc = computeNanoInc(smallestUnit, roundingInc)
  let roundedTimeNano = roundByInc(timeNano, nanoInc, roundingMode)

  /*
  TODO: make DRY with hoursInDay?
  */
  const [dayEpochNano0, dayEpochNano1] = clampRelativeDuration(
    calendarOps,
    { ...durationFields, ...durationTimeFieldDefaults },
    Unit.Day,
    sign,
    marker,
    markerToEpochNano,
    moveMarker,
  )

  const daySpanNano = bigNanoToNumber(
    diffBigNanos(dayEpochNano0, dayEpochNano1),
  )
  const beyondDayNano = roundedTimeNano - daySpanNano

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

/*
TODO: make abstract Marker type? will make calling more convenient
*/
export function nudgeRelativeDuration(
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: BigNano,
  _largestUnit: Unit,
  smallestUnit: Unit, // always >Day
  roundingInc: number,
  roundingMode: RoundingMode,
  calendarOps: MoveOps,
  marker: Marker,
  markerToEpochNano: MarkerToEpochNano,
  moveMarker: MoveMarker,
): [
  durationFields: DurationFields,
  movedEpochNano: BigNano,
  expandedBigUnit: boolean, // grew year/month/week/day?
] {
  const sign = computeDurationSign(durationFields) // TODO: already computed and non-zero?
  const smallestUnitFieldName = durationFieldNamesAsc[smallestUnit]

  const baseDurationFields = clearDurationFields(smallestUnit, durationFields)
  const truncedVal =
    divTrunc(durationFields[smallestUnitFieldName], roundingInc) * roundingInc

  baseDurationFields[smallestUnitFieldName] = truncedVal

  const [epochNano0, epochNano1] = clampRelativeDuration(
    calendarOps,
    baseDurationFields,
    smallestUnit,
    roundingInc * sign,
    marker,
    markerToEpochNano,
    moveMarker,
  )

  // usually between 0-1, however can be higher when weeks aren't bounded by months
  const frac = computeEpochNanoFrac(endEpochNano, epochNano0, epochNano1)

  const exactVal = truncedVal + frac * sign * roundingInc
  const roundedVal = roundByInc(exactVal, roundingInc, roundingMode)
  const expanded = Math.sign(roundedVal - exactVal) === sign

  baseDurationFields[smallestUnitFieldName] = roundedVal

  return [
    baseDurationFields,
    expanded ? epochNano1 : epochNano0,
    expanded, // guaranteed to be a big unit because of big smallestUnit
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
  calendarOps: MoveOps,
  marker: Marker,
  markerToEpochNano: MarkerToEpochNano,
  moveMarker: MoveMarker,
): DurationFields {
  const sign = computeDurationSign(durationFields) // TODO: already computed and non-zero?

  for (
    let currentUnit: Unit = smallestUnit + 1;
    currentUnit <= largestUnit;
    currentUnit++
  ) {
    // if balancing day->month->year, skip weeks
    if (currentUnit === Unit.Week && largestUnit !== Unit.Week) {
      continue
    }

    /*
    TODO: consolidate with clamping?
    */
    const baseDurationFields = clearDurationFields(currentUnit, durationFields)
    baseDurationFields[durationFieldNamesAsc[currentUnit]] += sign

    const thresholdEpochNano = markerToEpochNano(
      moveMarker(calendarOps, marker, baseDurationFields),
    )
    const beyondThresholdNano = bigNanoToNumber(
      diffBigNanos(thresholdEpochNano, endEpochNano),
    )

    if (!beyondThresholdNano || Math.sign(beyondThresholdNano) === sign) {
      durationFields = baseDurationFields
    } else {
      break
    }
  }

  return durationFields
}
