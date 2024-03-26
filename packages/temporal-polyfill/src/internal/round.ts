import {
  BigNano,
  addBigNanos,
  bigNanoToNumber,
  createBigNano,
  diffBigNanos,
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
  nanoToDurationDayTimeFields,
  nanoToDurationTimeFields,
} from './durationMath'
import * as errorMessages from './errorMessages'
import {
  IsoDateTimeFields,
  IsoTimeFields,
  clearIsoFields,
  isoTimeFieldDefaults,
} from './isoFields'
import {
  DiffMarkers,
  Marker,
  MarkerToEpochNano,
  MoveMarker,
} from './markerSystem'
import { moveByIsoDays } from './move'
import {
  EpochDisambig,
  OffsetDisambig,
  RoundingMode,
  roundingModeFuncs,
} from './options'
import { RoundingOptions, refineRoundingOptions } from './optionsRefine'
import {
  DateTimeSlots,
  EpochSlots,
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
  givenFieldsToBigNano,
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
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
  options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>,
): ZonedDateTimeSlots<C, T> {
  let { epochNanoseconds, timeZone, calendar } = zonedDateTimeSlots
  const [smallestUnit, roundingInc, roundingMode] =
    refineRoundingOptions(options)

  // short circuit (elsewhere? consolidate somehow?)
  if (smallestUnit === Unit.Nanosecond && roundingInc === 1) {
    return zonedDateTimeSlots
  }

  const timeZoneOps = getTimeZoneOps(timeZone)

  if (smallestUnit === Unit.Day) {
    epochNanoseconds = roundZonedEpoch(
      computeDayInterval,
      timeZoneOps,
      zonedDateTimeSlots,
      roundingMode,
      roundingInc,
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
  const roundedIsoFields = roundTime(
    slots,
    ...(refineRoundingOptions(options, Unit.Hour) as [
      TimeUnit,
      number,
      RoundingMode,
    ]),
  )
  return createPlainTimeSlots(roundedIsoFields)
}

// Zoned Utils (weird place for this)
// -----------------------------------------------------------------------------

export function computeZonedHoursInDay<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  slots: ZonedDateTimeSlots<C, T>,
): number {
  const timeZoneOps = getTimeZoneOps(slots.timeZone)
  const isoFields = zonedEpochSlotsToIso(slots, timeZoneOps)
  const [isoFields1, isoFields0] = computeDayInterval(isoFields)
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

// Low-Level
// -----------------------------------------------------------------------------

export function roundZonedEpoch<C>(
  computeInterval: (
    isoFields: DateTimeSlots<C>,
    roundingInc: number,
  ) => DateTimeInterval,
  timeZoneOps: TimeZoneOps,
  slots: ZonedEpochSlots<C, unknown>,
  roundingMode: RoundingMode,
  roundingInc: number,
): BigNano {
  const isoSlots = zonedEpochSlotsToIso(slots, timeZoneOps)
  const [isoFields1, isoFields0] = computeInterval(isoSlots, roundingInc)
  const epochNano0 = getSingleInstantFor(timeZoneOps, isoFields0)
  const epochNano1 = getSingleInstantFor(timeZoneOps, isoFields1)
  const frac = computeEpochNanoFrac(
    epochNano0,
    epochNano1,
    slots.epochNanoseconds,
  )
  const grow = roundWithMode(frac, roundingMode)
  const epochNanoRounded = grow ? epochNano1 : epochNano0
  return epochNanoRounded
}

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
    ...moveByIsoDays(isoFields, dayDelta),
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

// Utils: Interval & Floor
// -----------------------------------------------------------------------------

export type DateTimeEdge = [IsoDateTimeFields, ...any[]]
export type DateTimeInterval = [
  exclEnd: IsoDateTimeFields, // end is first!
  start: IsoDateTimeFields,
]

export function computeZonedEdge<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  computeEdge: (slots: DateTimeSlots<C>) => DateTimeEdge,
  slots: ZonedDateTimeSlots<C, T>,
): ZonedDateTimeSlots<C, T> {
  const { timeZone, calendar } = slots
  const timeZoneOps = getTimeZoneOps(timeZone)
  const isoFields = zonedEpochSlotsToIso(slots, timeZoneOps)
  const [isoFields1] = computeEdge(isoFields)
  const epochNano1 = getSingleInstantFor(timeZoneOps, isoFields1)
  return createZonedDateTimeSlots(epochNano1, timeZone, calendar)
}

export function computeDayInterval(
  isoFields: IsoDateTimeFields,
  roundingInc = 1,
): DateTimeInterval {
  const [isoFields0] = computeDayFloor(isoFields)
  const isoFields1 = {
    ...moveByIsoDays(isoFields0, roundingInc),
    ...isoTimeFieldDefaults,
  }
  return [isoFields1, isoFields0] // end is first!
}

export const computeDayFloor = (isoFields: IsoDateTimeFields): DateTimeEdge => [
  clearIsoFields(isoFields, Unit.Day),
]

export const computeHourFloor = (
  isoFields: IsoDateTimeFields,
): DateTimeEdge => [clearIsoFields(isoFields, Unit.Hour)]

export const computeMinuteFloor = (
  isoFields: IsoDateTimeFields,
): DateTimeEdge => [clearIsoFields(isoFields, Unit.Minute)]

export const computeSecondFloor = (
  isoFields: IsoDateTimeFields,
): DateTimeEdge => [clearIsoFields(isoFields, Unit.Second)]

export const computeMillisecondFloor = (
  isoFields: IsoDateTimeFields,
): DateTimeEdge => [clearIsoFields(isoFields, Unit.Millisecond)]

export const computeMicrosecondFloor = (
  isoFields: IsoDateTimeFields,
): DateTimeEdge => [clearIsoFields(isoFields, Unit.Microsecond)]

// Duration
// -----------------------------------------------------------------------------

export function roundDayTimeDuration(
  durationFields: DurationFields,
  largestUnit: DayTimeUnit,
  smallestUnit: DayTimeUnit,
  roundingInc: number,
  roundingMode: RoundingMode,
): DurationFields {
  return {
    ...durationFieldDefaults,
    ...balanceDayTimeDuration(
      durationFields,
      largestUnit,
      smallestUnit,
      roundingInc,
      roundingMode,
    ),
  }
}

function balanceDayTimeDuration(
  durationFields: DurationFields,
  largestUnit: DayTimeUnit,
  smallestUnit: DayTimeUnit,
  roundingInc: number,
  roundingMode: RoundingMode,
): Partial<DurationFields> {
  const bigNano = durationFieldsToBigNano(durationFields)
  const roundedLargeNano = roundBigNano(
    bigNano,
    smallestUnit,
    roundingInc,
    roundingMode,
  )
  return nanoToDurationDayTimeFields(roundedLargeNano, largestUnit)
}

export function balanceDayTimeDurationByInc(
  durationFields: DurationFields,
  largestUnit: DayTimeUnit,
  nanoInc: number, // REQUIRED: not larger than a day
  roundingMode: RoundingMode,
): Partial<DurationFields> {
  const bigNano = durationFieldsToBigNano(durationFields, largestUnit)
  const roundedLargeNano = roundBigNanoByInc(bigNano, nanoInc, roundingMode)
  return nanoToDurationDayTimeFields(roundedLargeNano, largestUnit)
}

/*
TODO: caller should short-circuit if
  !sign || (smallestUnit === Unit.Nanosecond && roundingInc === 1)
*/
export function roundRelativeDuration(
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: BigNano,
  largestUnit: Unit,
  smallestUnit: Unit,
  roundingInc: number,
  roundingMode: RoundingMode,
  // MarkerDiffSystem...
  marker: Marker,
  markerToEpochNano: MarkerToEpochNano,
  moveMarker: MoveMarker,
  _diffMarkers?: DiffMarkers,
): DurationFields {
  const nudgeFunc = (
    smallestUnit > Unit.Day
      ? nudgeRelativeDuration
      : (marker as EpochSlots).epochNanoseconds && smallestUnit < Unit.Day
        ? nudgeZonedDurationTime
        : nudgeDurationDayTime
  ) as typeof nudgeRelativeDuration // most general

  let [roundedDurationFields, roundedEpochNano, grewBigUnit] = nudgeFunc(
    durationFields,
    endEpochNano,
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    // MarkerMoveSystem...
    marker,
    markerToEpochNano,
    moveMarker,
  )

  // grew a day/week/month/year?
  if (grewBigUnit) {
    roundedDurationFields = bubbleRelativeDuration(
      roundedDurationFields,
      roundedEpochNano,
      largestUnit,
      Math.max(Unit.Day, smallestUnit),
      // MarkerMoveSystem...
      marker,
      markerToEpochNano,
      moveMarker,
    )
  }

  return roundedDurationFields
}

// Rounding Numbers
// -----------------------------------------------------------------------------

export function computeNanoInc(
  smallestUnit: DayTimeUnit,
  roundingInc: number,
): number {
  return unitNanoMap[smallestUnit] * roundingInc
}

export function roundByInc(
  num: number,
  inc: number,
  roundingMode: RoundingMode,
): number {
  return roundWithMode(num / inc, roundingMode) * inc
}

export function roundToMinute(offsetNano: number): number {
  return roundByInc(offsetNano, nanoInMinute, RoundingMode.HalfExpand)
}

export function roundBigNano(
  bigNano: BigNano,
  smallestUnit: DayTimeUnit,
  roundingInc: number,
  roundingMode: RoundingMode,
  useDayOrigin?: boolean,
): BigNano {
  if (smallestUnit === Unit.Day) {
    const daysExact = bigNanoToNumber(bigNano, nanoInUtcDay, true)
    return [roundByInc(daysExact, roundingInc, roundingMode), 0]
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
  nanoInc: number, // REQUIRED: not larger than a day
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

export function roundWithMode(num: number, roundingMode: RoundingMode): number {
  return roundingModeFuncs[roundingMode](num)
}

// Nudge
// -----------------------------------------------------------------------------
/*
These functions actually do the heavy-lifting of rounding to a higher/lower marker,
and return the (day) delta. Also return the (potentially) unbalanced new duration.
*/

function nudgeDurationDayTime(
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
  const expandedBigUnit = Math.sign(roundedBigNano[0] - bigNano[0]) === sign

  const roundedDayTimeFields = nanoToDurationDayTimeFields(
    roundedBigNano,
    Math.min(largestUnit, Unit.Day),
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
function nudgeZonedDurationTime(
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: BigNano, // NOT NEEDED, just for conformance
  _largestUnit: Unit,
  smallestUnit: TimeUnit, // always <Day
  roundingInc: number,
  roundingMode: RoundingMode,
  // MarkerMoveSystem...
  marker: Marker,
  markerToEpochNano: MarkerToEpochNano,
  moveMarker: MoveMarker,
): [
  nudgedDurationFields: DurationFields,
  nudgedEpochNano: BigNano,
  expandedBigUnit: boolean, // grew year/month/week/day?
] {
  const sign = computeDurationSign(durationFields)
  let [dayDelta, timeNano] = givenFieldsToBigNano(
    durationFields,
    Unit.Hour,
    durationFieldNamesAsc,
  )
  const nanoInc = computeNanoInc(smallestUnit, roundingInc)
  let roundedTimeNano = roundByInc(timeNano, nanoInc, roundingMode)

  const [dayEpochNano0, dayEpochNano1] = clampRelativeDuration(
    { ...durationFields, ...durationTimeFieldDefaults },
    Unit.Day,
    sign,
    // MarkerMoveSystem...
    marker,
    markerToEpochNano,
    moveMarker,
  )

  const daySpanEpochNanoseconds = bigNanoToNumber(
    diffBigNanos(dayEpochNano0, dayEpochNano1),
  )
  const beyondDay = roundedTimeNano - daySpanEpochNanoseconds

  // rounded-time at start-of next day or beyond?
  // if so, rerun rounding with origin as next day
  if (!beyondDay || Math.sign(beyondDay) === sign) {
    dayDelta += sign
    roundedTimeNano = roundByInc(beyondDay, nanoInc, roundingMode)
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
  // MarkerMoveSystem...
  marker: Marker,
  markerToEpochNano: MarkerToEpochNano,
  moveMarker: MoveMarker,
): [
  durationFields: DurationFields,
  movedEpochNano: BigNano,
  expandedBigUnit: boolean, // grew year/month/week/day?
] {
  const sign = computeDurationSign(durationFields)
  const smallestUnitFieldName = durationFieldNamesAsc[smallestUnit]

  const baseDurationFields = clearDurationFields(durationFields, smallestUnit)
  const truncedVal =
    divTrunc(durationFields[smallestUnitFieldName], roundingInc) * roundingInc

  baseDurationFields[smallestUnitFieldName] = truncedVal

  const [epochNano0, epochNano1] = clampRelativeDuration(
    baseDurationFields,
    smallestUnit,
    roundingInc * sign,
    // MarkerMoveSystem...
    marker,
    markerToEpochNano,
    moveMarker,
  )

  // usually between 0-1, however can be higher when weeks aren't bounded by months
  const frac = computeEpochNanoFrac(epochNano0, epochNano1, endEpochNano)

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
  // MarkerMoveSystem...
  marker: Marker,
  markerToEpochNano: MarkerToEpochNano,
  moveMarker: MoveMarker,
): DurationFields {
  const sign = computeDurationSign(durationFields)

  for (
    let currentUnit: Unit = smallestUnit + 1;
    currentUnit <= largestUnit;
    currentUnit++
  ) {
    // if balancing day->month->year, skip weeks
    if (currentUnit === Unit.Week && largestUnit !== Unit.Week) {
      continue
    }

    const baseDurationFields = clearDurationFields(durationFields, currentUnit)
    baseDurationFields[durationFieldNamesAsc[currentUnit]] += sign

    const thresholdEpochNano = markerToEpochNano(
      moveMarker(marker, baseDurationFields),
    )
    const beyondThreshold = bigNanoToNumber(
      diffBigNanos(thresholdEpochNano, endEpochNano),
    )

    if (!beyondThreshold || Math.sign(beyondThreshold) === sign) {
      durationFields = baseDurationFields
    } else {
      break
    }
  }

  return durationFields
}
