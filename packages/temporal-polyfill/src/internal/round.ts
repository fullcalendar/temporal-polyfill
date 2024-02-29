import {
  BigNano,
  addBigNanoAndNumber,
  addBigNanos,
  bigNanoToNumber,
  createBigNano,
  diffBigNanos,
} from './bigNano'
import { DiffOps } from './calendarOps'
import {
  DurationFieldName,
  DurationFields,
  durationFieldDefaults,
  durationFieldNamesAsc,
  durationTimeFieldDefaults,
} from './durationFields'
import {
  clearDurationFields,
  computeDurationSign,
  durationFieldsToBigNano,
  nanoToDurationDayTimeFields,
  nanoToDurationTimeFields,
} from './durationMath'
import {
  IsoDateTimeFields,
  IsoTimeFields,
  isoTimeFieldDefaults,
} from './isoFields'
import { moveByIsoDays, moveRelativeMarker } from './move'
import {
  EpochDisambig,
  OffsetDisambig,
  RoundingMode,
  roundingModeFuncs,
} from './options'
import { RoundingOptions, refineRoundOptions } from './optionsRefine'
import {
  RelativeMarkerSlots,
  relativeMarkerToEpochNano,
} from './relativeSystem'
import {
  InstantSlots,
  PlainDateTimeSlots,
  PlainTimeSlots,
  ZonedDateTimeSlots,
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
  computeTimeInDay,
  getMatchingInstantFor,
} from './timeZoneOps'
import {
  clampRelativeDuration,
  computeEpochNanoFrac,
  totalBigNano,
} from './total'
import {
  DayTimeUnit,
  TimeUnit,
  Unit,
  UnitName,
  givenFieldsToBigNano,
  nanoInMinute,
  nanoInUtcDay,
  unitNanoMap,
} from './units'
import { divModFloor, divTrunc } from './utils'

// High-Level
// -----------------------------------------------------------------------------

export function roundInstant(
  instantSlots: InstantSlots,
  options: RoundingOptions | UnitName | DurationFieldName,
): InstantSlots {
  const [smallestUnit, roundingInc, roundingMode] = refineRoundOptions(
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

export function roundZonedDateTime<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
  options: RoundingOptions | UnitName,
): ZonedDateTimeSlots<C, T> {
  let { epochNanoseconds, timeZone, calendar } = zonedDateTimeSlots
  const [smallestUnit, roundingInc, roundingMode] = refineRoundOptions(options)

  // short circuit (elsewhere? consolidate somehow?)
  if (smallestUnit === Unit.Nanosecond && roundingInc === 1) {
    return zonedDateTimeSlots
  }

  const timeZoneOps = getTimeZoneOps(timeZone)
  const offsetNano = timeZoneOps.getOffsetNanosecondsFor(epochNanoseconds)
  let isoDateTimeFields = {
    ...epochNanoToIso(epochNanoseconds, offsetNano),
    calendar, // repeat below?
  }

  isoDateTimeFields = {
    calendar,
    ...roundDateTime(
      isoDateTimeFields,
      smallestUnit as DayTimeUnit,
      roundingInc,
      roundingMode,
      timeZoneOps,
    ),
  }

  epochNanoseconds = getMatchingInstantFor(
    timeZoneOps,
    isoDateTimeFields,
    offsetNano,
    OffsetDisambig.Prefer, // keep old offsetNano if possible
    EpochDisambig.Compat,
    true, // fuzzy
  )

  return createZonedDateTimeSlots(epochNanoseconds, timeZone, calendar)
}

export function roundPlainDateTime<C>(
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  options: RoundingOptions | UnitName,
): PlainDateTimeSlots<C> {
  const roundedIsoFields = roundDateTime(
    plainDateTimeSlots,
    ...(refineRoundOptions(options) as [DayTimeUnit, number, RoundingMode]),
  )

  return createPlainDateTimeSlots(roundedIsoFields, plainDateTimeSlots.calendar)
}

export function roundPlainTime(
  slots: PlainTimeSlots,
  options: RoundingOptions | UnitName,
): PlainTimeSlots {
  return createPlainTimeSlots(
    roundTime(
      slots,
      ...(refineRoundOptions(options, Unit.Hour) as [
        TimeUnit,
        number,
        RoundingMode,
      ]),
    ),
  )
}

// Low-Level
// -----------------------------------------------------------------------------

function roundDateTime(
  isoFields: IsoDateTimeFields,
  smallestUnit: DayTimeUnit,
  roundingInc: number,
  roundingMode: RoundingMode,
  timeZoneOps?: TimeZoneOps | undefined,
): IsoDateTimeFields {
  if (smallestUnit === Unit.Day) {
    return roundDateTimeToDay(isoFields, timeZoneOps, roundingMode)
  }

  return roundDateTimeToNano(
    isoFields,
    computeNanoInc(smallestUnit, roundingInc),
    roundingMode,
  )
}

function roundDateTimeToDay(
  isoFields: IsoDateTimeFields,
  timeZoneOps: TimeZoneOps | undefined,
  roundingMode: RoundingMode,
): IsoDateTimeFields {
  if (timeZoneOps) {
    const nanoInDay = computeTimeInDay(timeZoneOps, isoFields)
    const roundedTimeNano = roundByInc(
      isoTimeFieldsToNano(isoFields),
      nanoInDay,
      roundingMode,
    )
    const dayDelta = roundedTimeNano / nanoInDay

    return checkIsoDateTimeInBounds({
      ...moveByIsoDays(isoFields, dayDelta),
      ...isoTimeFieldDefaults,
    })
  }
  return roundDateTimeToNano(isoFields, nanoInUtcDay, roundingMode)
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

// Duration (w/o RelativeSystem)
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
  // ^has sign
  endEpochNano: BigNano,
  largestUnit: Unit,
  smallestUnit: Unit,
  roundingInc: number,
  roundingMode: RoundingMode,
  // RelativeSystem...
  marker: RelativeMarkerSlots,
  calendarOps: DiffOps,
  timeZoneOps?: TimeZoneOps,
): DurationFields {
  const nudgeFunc = (
    smallestUnit > Unit.Day
      ? nudgeRelativeDuration
      : timeZoneOps && smallestUnit < Unit.Day
        ? nudgeRelativeDurationTime
        : nudgeDurationDayTime
  ) as typeof nudgeRelativeDuration // most general

  let [roundedDurationFields, roundedEpochNano, grewBigUnit] = nudgeFunc(
    durationFields,
    endEpochNano,
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    // RelativeSystem for nudgeRelativeDuration...
    marker,
    calendarOps,
    timeZoneOps,
  )

  // grew a day/week/month/year?
  if (grewBigUnit) {
    roundedDurationFields = bubbleRelativeDuration(
      roundedDurationFields,
      roundedEpochNano,
      largestUnit,
      Math.max(Unit.Day, smallestUnit),
      // RelativeSystem...
      marker,
      calendarOps,
      timeZoneOps,
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
    return [
      roundByInc(totalBigNano(bigNano, Unit.Day), roundingInc, roundingMode),
      0,
    ]
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

function roundWithMode(num: number, roundingMode: RoundingMode): number {
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
Handles crazy DST edge case
Time ONLY. Days must use full-on marker moving
*/
function nudgeRelativeDurationTime(
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: BigNano, // NOT NEEDED, just for conformance
  _largestUnit: Unit,
  smallestUnit: TimeUnit, // always <Day
  roundingInc: number,
  roundingMode: RoundingMode,
  // RelativeSystem...
  marker: RelativeMarkerSlots,
  calendarOps: DiffOps,
  timeZoneOps?: TimeZoneOps,
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
    // RelativeSystem...
    marker,
    calendarOps,
    timeZoneOps,
  )

  const daySpanEpochNanoseconds = bigNanoToNumber(
    diffBigNanos(dayEpochNano0, dayEpochNano1),
  )
  const beyondDay = roundedTimeNano - daySpanEpochNanoseconds

  // TODO: document. somthing to do with rounding a zdt to the next day
  if (!beyondDay || Math.sign(beyondDay) === sign) {
    dayDelta += sign
    roundedTimeNano = roundByInc(beyondDay, nanoInc, roundingMode)
    endEpochNano = addBigNanoAndNumber(dayEpochNano1, roundedTimeNano)
  } else {
    endEpochNano = addBigNanoAndNumber(dayEpochNano0, roundedTimeNano)
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
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: BigNano,
  _largestUnit: Unit,
  smallestUnit: Unit, // always >Day
  roundingInc: number,
  roundingMode: RoundingMode,
  // RelativeSystem...
  marker: RelativeMarkerSlots,
  calendarOps: DiffOps,
  timeZoneOps?: TimeZoneOps,
): [
  durationFields: DurationFields,
  movedEpochNano: BigNano,
  expandedBigUnit: boolean, // grew year/month/week/day?
] {
  const sign = computeDurationSign(durationFields)
  const smallestUnitFieldName = durationFieldNamesAsc[smallestUnit]

  const baseDurationFields = clearDurationFields(
    durationFields,
    smallestUnit - 1,
  )
  const truncedVal =
    divTrunc(durationFields[smallestUnitFieldName], roundingInc) * roundingInc

  baseDurationFields[smallestUnitFieldName] = truncedVal

  const [epochNano0, epochNano1] = clampRelativeDuration(
    baseDurationFields,
    smallestUnit,
    roundingInc * sign,
    // RelativeSystem...
    marker,
    calendarOps,
    timeZoneOps,
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
  // RelativeSystem...
  marker: RelativeMarkerSlots,
  calendarOps: DiffOps,
  timeZoneOps?: TimeZoneOps,
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

    const baseDurationFields = clearDurationFields(
      durationFields,
      currentUnit - 1,
    )
    baseDurationFields[durationFieldNamesAsc[currentUnit]] += sign

    const thresholdEpochNano = relativeMarkerToEpochNano(
      moveRelativeMarker(baseDurationFields, marker, calendarOps, timeZoneOps),
      timeZoneOps,
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
