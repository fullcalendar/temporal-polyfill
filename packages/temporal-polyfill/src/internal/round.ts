import { DayTimeNano, addDayTimeNanoAndNumber, addDayTimeNanos, createDayTimeNano, dayTimeNanoToNumber, diffDayTimeNanos } from './dayTimeNano'
import {
  DurationFields,
  durationFieldDefaults,
  durationFieldNamesAsc,
  durationTimeFieldDefaults,
} from './durationFields'
import {
  DiffMarkers,
  MarkerToEpochNano,
  MoveMarker,
  queryDurationSign,
  durationFieldsToDayTimeNano,
  nanoToDurationDayTimeFields,
  nanoToDurationTimeFields,
  clearDurationFields,
} from './durationMath'
import { IsoTimeFields, isoTimeFieldDefaults, IsoDateTimeFields } from './isoFields'
import { checkIsoDateTimeInBounds, epochNanoToIso, isoTimeFieldsToNano, nanoToIsoTimeAndDay } from './timeMath'
import { EpochDisambig, OffsetDisambig, RoundingMode, roundingModeFuncs } from './options'
import { TimeZoneOps, computeNanosecondsInDay, getMatchingInstantFor } from './timeZoneOps'
import {
  nanoInMinute,
  nanoInUtcDay,
  unitNanoMap,
  Unit,
  DayTimeUnit,
  TimeUnit,
  givenFieldsToDayTimeNano,
  UnitName,
} from './units'
import { divModFloor, divTrunc, identityFunc } from './utils'
import { moveByIsoDays } from './move'
import { clampRelativeDuration, computeEpochNanoFrac, totalDayTimeNano } from './total'
import { InstantBranding, InstantSlots, PlainDateTimeBranding, PlainDateTimeSlots, PlainTimeBranding, PlainTimeSlots, ZonedDateTimeBranding, ZonedDateTimeSlots, createInstantSlots, createPlainDateTimeSlots, createPlainTimeSlots, createZonedDateTimeSlots } from './slots'
import { RoundingOptions, refineRoundOptions } from './optionsRefine'

// High-Level
// -------------------------------------------------------------------------------------------------

export function roundInstant(
  instantSlots: InstantSlots,
  options: RoundingOptions | UnitName
): InstantSlots {
  const [smallestUnit, roundingInc, roundingMode] = refineRoundOptions( // TODO: inline this
    options,
    Unit.Hour,
    true, // solarMode
  )

  return createInstantSlots(
    roundDayTimeNano(
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
    )
  }

  epochNanoseconds = getMatchingInstantFor(
    timeZoneOps,
    isoDateTimeFields,
    offsetNano,
    OffsetDisambig.Prefer, // keep old offsetNano if possible
    EpochDisambig.Compat,
    true, // fuzzy
  )

  return createZonedDateTimeSlots(
    epochNanoseconds,
    timeZone,
    calendar,
  )
}

export function roundPlainDateTime<C>(
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  options: RoundingOptions | UnitName,
): PlainDateTimeSlots<C> {
  const roundedIsoFields = roundDateTime(
    plainDateTimeSlots,
    ...(refineRoundOptions(options) as [DayTimeUnit, number, RoundingMode]),
  )

  return createPlainDateTimeSlots(
    roundedIsoFields,
    plainDateTimeSlots.calendar,
  )
}

export function roundPlainTime(
  slots: PlainTimeSlots,
  options: RoundingOptions | UnitName,
): PlainTimeSlots {
  return createPlainTimeSlots(
    roundTime(
      slots,
      ...(refineRoundOptions(options, Unit.Hour) as [TimeUnit, number, RoundingMode])
    ),
  )
}

// Low-Level
// -------------------------------------------------------------------------------------------------

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
    const nanoInDay = computeNanosecondsInDay(timeZoneOps, isoFields)
    const roundedTimeNano = roundByInc(isoTimeFieldsToNano(isoFields), nanoInDay, roundingMode)
    const dayDelta = roundedTimeNano / nanoInDay

    return checkIsoDateTimeInBounds({
      ...moveByIsoDays(isoFields, dayDelta),
      ...isoTimeFieldDefaults,
    })
  } else {
    return roundDateTimeToNano(isoFields, nanoInUtcDay, roundingMode)
  }
}

export function roundDateTimeToNano(
  isoFields: IsoDateTimeFields,
  nanoInc: number,
  roundingMode: RoundingMode,
): IsoDateTimeFields {
  const [roundedIsoFields, dayDelta] = roundTimeToNano(isoFields, nanoInc, roundingMode)

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
): [
  IsoTimeFields,
  number,
] {
  return nanoToIsoTimeAndDay(
    roundByInc(isoTimeFieldsToNano(isoFields), nanoInc, roundingMode),
  )
}

// Duration (w/o marker system)
// -------------------------------------------------------------------------------------------------

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
  const dayTimeNano = durationFieldsToDayTimeNano(durationFields, Unit.Day)
  const roundedLargeNano = roundDayTimeNano(dayTimeNano, smallestUnit, roundingInc, roundingMode)
  return nanoToDurationDayTimeFields(roundedLargeNano, largestUnit)
}

export function balanceDayTimeDurationByInc(
  durationFields: DurationFields,
  largestUnit: DayTimeUnit,
  nanoInc: number, // REQUIRED: not larger than a day
  roundingMode: RoundingMode,
): Partial<DurationFields> {
  const dayTimeNano = durationFieldsToDayTimeNano(durationFields, largestUnit)
  const roundedLargeNano = roundDayTimeNanoByInc(dayTimeNano, nanoInc, roundingMode)
  return nanoToDurationDayTimeFields(roundedLargeNano, largestUnit)
}

/*
TODO: caller should short-circuit if
  !sign || (smallestUnit === Unit.Nanosecond && roundingInc === 1)
*/
export function roundRelativeDuration<M>(
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  // ^has sign
  endEpochNano: DayTimeNano,
  largestUnit: Unit,
  smallestUnit: Unit,
  roundingInc: number,
  roundingMode: RoundingMode,
  // marker system...
  marker: M,
  markerToEpochNano: MarkerToEpochNano<M>,
  moveMarker: MoveMarker<M>,
  diffMarkers?: DiffMarkers<M>, // unused
): DurationFields {
  const nudgeFunc = (
    (markerToEpochNano === identityFunc) // is zoned?
      ? smallestUnit > Unit.Day
        ? nudgeRelativeDuration
        : smallestUnit === Unit.Day
          ? nudgeDurationDayTime // doesn't worry about DST
          : nudgeRelativeDurationTime // handles DST
      : smallestUnit > Unit.Day
        ? nudgeRelativeDuration
        : nudgeDurationDayTime // doesn't worry about DST
  ) as typeof nudgeRelativeDuration // accepts all units

  let [roundedDurationFields, roundedEpochNano, grewBigUnit] = nudgeFunc(
    durationFields,
    endEpochNano,
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    // marker system only needed for nudgeRelativeDuration...
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
      // marker system...
      marker,
      markerToEpochNano,
      moveMarker,
    )
  }

  return roundedDurationFields
}

// Rounding Numbers
// -------------------------------------------------------------------------------------------------

export function computeNanoInc(smallestUnit: DayTimeUnit, roundingInc: number): number {
  return unitNanoMap[smallestUnit] * roundingInc
}

export function roundByInc(num: number, inc: number, roundingMode: RoundingMode): number {
  return roundWithMode(num / inc, roundingMode) * inc
}

export function roundToMinute(offsetNano: number): number {
  return roundByInc(offsetNano, nanoInMinute, RoundingMode.HalfExpand)
}

export function roundDayTimeNano(
  dayTimeNano: DayTimeNano,
  smallestUnit: DayTimeUnit,
  roundingInc: number,
  roundingMode: RoundingMode,
  useDayOrigin?: boolean
): DayTimeNano {
  if (smallestUnit === Unit.Day) {
    return [
      roundByInc(totalDayTimeNano(dayTimeNano, Unit.Day), roundingInc, roundingMode),
      0,
    ]
  }

  return roundDayTimeNanoByInc(
    dayTimeNano,
    computeNanoInc(smallestUnit, roundingInc),
    roundingMode,
    useDayOrigin
  )
}

export function roundDayTimeNanoByInc(
  dayTimeNano: DayTimeNano,
  nanoInc: number, // REQUIRED: not larger than a day
  roundingMode: RoundingMode,
  useDayOrigin?: boolean
): DayTimeNano {
  let [days, timeNano] = dayTimeNano

  if (useDayOrigin && timeNano < 0) {
    timeNano += nanoInUtcDay
    days -= 1
  }

  const [dayDelta, roundedTimeNano] = divModFloor(
    roundByInc(timeNano, nanoInc, roundingMode),
    nanoInUtcDay,
  )

  return createDayTimeNano(days + dayDelta, roundedTimeNano)
}

function roundWithMode(num: number, roundingMode: RoundingMode): number {
  return roundingModeFuncs[roundingMode](num)
}

// Nudge
// -------------------------------------------------------------------------------------------------
/*
These functions actually do the heavy-lifting of rounding to a higher/lower marker,
and return the (day) delta. Also return the (potentially) unbalanced new duration.
*/

function nudgeDurationDayTime(
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: DayTimeNano, // NOT NEEDED, just for adding result to
  largestUnit: DayTimeUnit,
  smallestUnit: DayTimeUnit, // always <=Day
  roundingInc: number,
  roundingMode: RoundingMode,
): [
  nudgedDurationFields: DurationFields,
  nudgedEpochNano: DayTimeNano,
  expandedBigUnit: boolean, // grew year/month/week/day?
] {
  const sign = queryDurationSign(durationFields)
  const dayTimeNano = durationFieldsToDayTimeNano(durationFields, Unit.Day)
  const roundedDayTimeNano = roundDayTimeNano(dayTimeNano, smallestUnit, roundingInc, roundingMode)
  const nanoDiff = diffDayTimeNanos(dayTimeNano, roundedDayTimeNano)
  const expandedBigUnit = Math.sign(roundedDayTimeNano[0] - dayTimeNano[0]) === sign

  const roundedDayTimeFields = nanoToDurationDayTimeFields(
    roundedDayTimeNano,
    Math.min(largestUnit, Unit.Day),
  )
  const nudgedDurationFields = {
    ...durationFields,
    ...roundedDayTimeFields,
  }

  return [
    nudgedDurationFields,
    addDayTimeNanos(endEpochNano, nanoDiff),
    expandedBigUnit,
  ]
}

/*
Handles crazy DST edge case
Time ONLY. Days must use full-on marker moving
*/
function nudgeRelativeDurationTime<M>(
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: DayTimeNano, // NOT NEEDED, just for conformance
  largestUnit: Unit,
  smallestUnit: TimeUnit, // always <Day
  roundingInc: number,
  roundingMode: RoundingMode,
  // marker system...
  marker: M,
  markerToEpochNano: MarkerToEpochNano<M>,
  moveMarker: MoveMarker<M>,
): [
  nudgedDurationFields: DurationFields,
  nudgedEpochNano: DayTimeNano,
  expandedBigUnit: boolean, // grew year/month/week/day?
] {
  const sign = queryDurationSign(durationFields)
  let [dayDelta, timeNano] = givenFieldsToDayTimeNano(durationFields, Unit.Hour, durationFieldNamesAsc)
  const nanoInc = computeNanoInc(smallestUnit, roundingInc)
  let roundedTimeNano = roundByInc(timeNano, nanoInc, roundingMode)

  const [dayEpochNano0, dayEpochNano1] = clampRelativeDuration(
    { ...durationFields, ...durationTimeFieldDefaults },
    Unit.Day,
    sign,
    // marker system...
    marker,
    markerToEpochNano,
    moveMarker,
  )

  const daySpanEpochNanoseconds = dayTimeNanoToNumber(
    diffDayTimeNanos(dayEpochNano0, dayEpochNano1),
  )
  const beyondDay = roundedTimeNano - daySpanEpochNanoseconds

  // TODO: document. somthing to do with rounding a zdt to the next day
  if (!beyondDay || Math.sign(beyondDay) === sign) {
    dayDelta += sign
    roundedTimeNano = roundByInc(beyondDay, nanoInc, roundingMode)
    endEpochNano = addDayTimeNanoAndNumber(dayEpochNano1, roundedTimeNano)
  } else {
    endEpochNano = addDayTimeNanoAndNumber(dayEpochNano0, roundedTimeNano)
  }

  const durationTimeFields = nanoToDurationTimeFields(roundedTimeNano)

  const nudgedDurationFields = {
    ...durationFields,
    ...durationTimeFields,
    days: durationFields.days + dayDelta,
  }

  return [nudgedDurationFields, endEpochNano, Boolean(dayDelta)]
}

function nudgeRelativeDuration<M>(
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: DayTimeNano,
  largestUnit: Unit,
  smallestUnit: Unit, // always >Day
  roundingInc: number,
  roundingMode: RoundingMode,
  // marker system...
  marker: M,
  markerToEpochNano: MarkerToEpochNano<M>,
  moveMarker: MoveMarker<M>,
): [
  durationFields: DurationFields,
  movedEpochNano: DayTimeNano,
  expandedBigUnit: boolean, // grew year/month/week/day?
] {
  const sign = queryDurationSign(durationFields)
  const smallestUnitFieldName = durationFieldNamesAsc[smallestUnit]

  const baseDurationFields = clearDurationFields(durationFields, smallestUnit - 1)
  const truncedVal = divTrunc(durationFields[smallestUnitFieldName], roundingInc) * roundingInc
  baseDurationFields[smallestUnitFieldName] = truncedVal

  const [epochNano0, epochNano1] = clampRelativeDuration(
    baseDurationFields,
    smallestUnit,
    roundingInc * sign,
    // marker system...
    marker,
    markerToEpochNano,
    moveMarker,
  )

  // usually between 0-1, however can be higher when weeks aren't bounded by months
  const frac = computeEpochNanoFrac(epochNano0, epochNano1, endEpochNano)

  const exactVal = truncedVal + (frac * sign * roundingInc)
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
// -------------------------------------------------------------------------------------------------

function bubbleRelativeDuration<M>(
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: DayTimeNano,
  largestUnit: Unit,
  smallestUnit: Unit, // guaranteed Day/Week/Month/Year
  // marker system...
  marker: M,
  markerToEpochNano: MarkerToEpochNano<M>,
  moveMarker: MoveMarker<M>,
): DurationFields {
  const sign = queryDurationSign(durationFields)

  for (
    let currentUnit: Unit = smallestUnit + 1;
    currentUnit <= largestUnit;
    currentUnit++
  ) {
    // if balancing day->month->year, skip weeks
    if (
      currentUnit === Unit.Week &&
      largestUnit !== Unit.Week
    ) {
      continue
    }

    const baseDurationFields = clearDurationFields(durationFields, currentUnit - 1)
    baseDurationFields[durationFieldNamesAsc[currentUnit]] += sign

    const thresholdEpochNano = markerToEpochNano(
      moveMarker(marker, baseDurationFields),
    )
    const beyondThreshold = dayTimeNanoToNumber(
      diffDayTimeNanos(thresholdEpochNano, endEpochNano),
    )

    if (!beyondThreshold || Math.sign(beyondThreshold) === sign) {
      durationFields = baseDurationFields
    } else {
      break
    }
  }

  return durationFields
}
