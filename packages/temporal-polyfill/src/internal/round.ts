import {
  BigNano,
  addBigNanos,
  bigNanoToExactDays,
  bigNanoToNumber,
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
import { CalendarDateFields, TimeFields } from './fieldTypes'
import { IsoDateTimeCarrier } from './isoFields'
import { moveByDays } from './move'
import { roundingModeFuncs } from './optionsConfig'
import { EpochDisambig, OffsetDisambig, RoundingMode } from './optionsModel'
import { RoundingOptions } from './optionsModel'
import { refineRoundingOptions } from './optionsRoundingRefine'
import {
  Marker,
  MarkerToEpochNano,
  MoveMarker,
  isUniformUnit,
  isZonedEpochSlots,
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
  epochNanoToIso,
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
export function roundZonedDateTime(
  slots: ZonedDateTimeSlots,
  options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>,
): ZonedDateTimeSlots {
  let { epochNanoseconds, timeZone, calendar } = slots
  const [smallestUnit, roundingInc, roundingMode] =
    refineRoundingOptions(options)

  if (smallestUnit === Unit.Nanosecond && roundingInc === 1) {
    return slots
  }

  const timeZoneImpl = queryTimeZone(timeZone)

  if (smallestUnit === Unit.Day) {
    // no need for checking in-bounds. entire day of valid zdt is valid
    epochNanoseconds = roundZonedEpochToInterval(
      (slots) => computeDayInterval(slots.isoDate),
      timeZoneImpl,
      slots,
      roundingMode,
    )
  } else {
    const offsetNano = timeZoneImpl.getOffsetNanosecondsFor(epochNanoseconds)
    const { isoDate, time } = epochNanoToIso(epochNanoseconds, offsetNano)
    // TODO: ^optimize with zonedEpochSlotsToIso?

    const roundedIsoDateTime = roundDateTime(
      isoDate,
      time,
      smallestUnit as DayTimeUnit,
      roundingInc,
      roundingMode,
    )
    epochNanoseconds = getMatchingInstantFor(
      timeZoneImpl,
      roundedIsoDateTime.isoDate,
      roundedIsoDateTime.time,
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
export function roundPlainDateTime(
  slots: PlainDateTimeSlots,
  options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>,
): PlainDateTimeSlots {
  const roundedIsoDateTime = roundDateTime(
    slots.isoDate,
    slots.time,
    ...(refineRoundingOptions(options) as [DayTimeUnit, number, RoundingMode]),
  )
  return createPlainDateTimeSlots(
    roundedIsoDateTime.isoDate,
    roundedIsoDateTime.time,
    slots.calendar,
  )
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
  const roundedTimeFields = roundTime(slots.time, a, b, c)
  return createPlainTimeSlots(roundedTimeFields)
}

// Zoned Utils
// -----------------------------------------------------------------------------

export function computeZonedHoursInDay(slots: ZonedDateTimeSlots): number {
  const timeZoneImpl = queryTimeZone(slots.timeZone)

  const { isoDate } = zonedEpochSlotsToIso(slots, timeZoneImpl)
  const [isoFields0, isoFields1] = computeDayInterval(isoDate)

  const epochNano0 = getStartOfDayInstantFor(
    timeZoneImpl,
    isoFields0.isoDate,
    isoFields0.time,
  )
  const epochNano1 = getStartOfDayInstantFor(
    timeZoneImpl,
    isoFields1.isoDate,
    isoFields1.time,
  )

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
  const { timeZone, calendar } = slots
  const timeZoneImpl = queryTimeZone(timeZone)
  const epochNano1 = alignZonedEpoch(computeDayFloor, timeZoneImpl, slots)
  // nudging within-day guarantees in-bounds
  return createZonedDateTimeSlots(epochNano1, timeZone, calendar)
}

/*
For year/month/week/day only
*/
export function alignZonedEpoch(
  computeAlignment: (slots: AbstractDateTimeSlots) => IsoDateTimeCarrier,
  timeZoneImpl: TimeZoneImpl,
  slots: ZonedDateTimeSlots,
): BigNano {
  const isoDateTime = zonedEpochSlotsToIso(slots, timeZoneImpl)
  const isoFields1 = computeAlignment(isoDateTime)
  const epochNano1 = getStartOfDayInstantFor(
    timeZoneImpl,
    isoFields1.isoDate,
    isoFields1.time,
  )
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
  const epochNano0 = getStartOfDayInstantFor(
    timeZoneImpl,
    isoFields0.isoDate,
    isoFields0.time,
  )
  const epochNano1 = getStartOfDayInstantFor(
    timeZoneImpl,
    isoFields1.isoDate,
    isoFields1.time,
  )

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
// TODO: combine with below?

function roundDateTime(
  isoDate: CalendarDateFields,
  time: TimeFields,
  smallestUnit: DayTimeUnit,
  roundingInc: number,
  roundingMode: RoundingMode,
): IsoDateTimeCarrier {
  return roundDateTimeToNano(
    isoDate,
    time,
    computeNanoInc(smallestUnit, roundingInc),
    roundingMode,
  )
}

export function roundDateTimeToNano(
  isoDate: CalendarDateFields,
  time: TimeFields,
  nanoInc: number,
  roundingMode: RoundingMode,
): IsoDateTimeCarrier {
  const [roundedTimeFields, dayDelta] = roundTimeToNano(
    time,
    nanoInc,
    roundingMode,
  )

  const roundedIsoDate = moveByDays(isoDate, dayDelta)
  checkIsoDateTimeInBounds(roundedIsoDate, roundedTimeFields)
  return {
    isoDate: roundedIsoDate,
    time: roundedTimeFields,
  }
}

function roundTime(
  timeFields: TimeFields,
  smallestUnit: TimeUnit,
  roundingInc: number,
  roundingMode: RoundingMode,
): TimeFields {
  return roundTimeToNano(
    timeFields,
    computeNanoInc(smallestUnit, roundingInc),
    roundingMode,
  )[0]
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

export type IsoDateTimeInterval = [IsoDateTimeCarrier, IsoDateTimeCarrier]

export function computeDayInterval(
  isoDate: CalendarDateFields,
): IsoDateTimeInterval {
  const isoFields0 = { isoDate, time: timeFieldDefaults }
  const isoFields1 = {
    isoDate: moveByDays(isoFields0.isoDate, 1),
    time: timeFieldDefaults,
  }
  return [isoFields0, isoFields1]
}

// for date-times
// to convert date -> date-time, simply use { isoDate, time: timeFieldDefaults }
export function computeDayFloor(slots: IsoDateTimeCarrier): IsoDateTimeCarrier {
  return {
    isoDate: slots.isoDate,
    time: timeFieldDefaults,
  }
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
      : isZonedEpochSlots(marker) &&
          smallestUnit < Unit.Day &&
          largestUnit >= Unit.Day
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

  let roundedTimeNano: number

  // For halfEven ties (0.5), parity must account for days' contribution
  // to total increments, not just the timeNano portion
  //
  if (roundingMode === RoundingMode.HalfEven) {
    const timeExact = timeNano / nanoInc
    if (Math.abs(timeExact % 1) === 0.5) {
      const incrementsInDay = nanoInUtcDay / nanoInc
      const timeFloor = Math.floor(timeExact)
      // Total floor increments = days * increments_per_day + timeFloor
      // We only need parity, so compute it modularly
      const daysParity = (Math.abs(days) % 2) * (incrementsInDay % 2)
      const timeFloorParity = Math.abs(timeFloor) % 2
      const totalFloorIsOdd = (daysParity + timeFloorParity) % 2 === 1
      // halfEven: round to even total → if floor is odd, round away from zero
      const roundedTotal = totalFloorIsOdd ? timeFloor + 1 : timeFloor
      roundedTimeNano = roundedTotal * nanoInc
    } else {
      roundedTimeNano = roundByInc(timeNano, nanoInc, roundingMode)
    }
  } else {
    roundedTimeNano = roundByInc(timeNano, nanoInc, roundingMode)
  }

  const [dayDelta, finalTimeNano] = divModFloor(roundedTimeNano, nanoInUtcDay)

  return createBigNano(days + dayDelta, finalTimeNano)
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
  roundingInc: number, // always >=Day
  roundingMode: RoundingMode,
  marker: Marker,
  markerToEpochNano: MarkerToEpochNano,
  moveMarker: MoveMarker,
): [
  nudgedDurationFields: DurationFields,
  nudgedEpochNano: BigNano,
  expandedBigUnit: boolean, // grew year/month/week/day?
] {
  const sign = computeDurationSign(durationFields) || 1 // TODO: already computed and non-zero?

  const timeNano = bigNanoToNumber(
    durationFieldsToBigNano(durationFields, Unit.Hour),
  )
  const nanoInc = computeNanoInc(smallestUnit, roundingInc)
  let roundedTimeNano = roundByInc(timeNano, nanoInc, roundingMode)

  const dayWindow = clampRelativeDuration(
    { ...durationFields, ...durationTimeFieldDefaults },
    Unit.Day, // clampUnit
    sign, // clampDistance
    marker,
    markerToEpochNano,
    moveMarker,
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

  // convert days to whole weeks
  if (smallestUnit === Unit.Week) {
    // HACK to assume 7 days in a week. Works okay for now since applies to all current calendars.
    // Necessary because NudgeToCalendarUnit requires the PlainDate fields for this conversion.
    // TODO: refactor marker system. use RelativeTo record instead:
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
    marker,
    markerToEpochNano,
    moveMarker,
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
      moveMarker(marker, baseDurationFields),
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
