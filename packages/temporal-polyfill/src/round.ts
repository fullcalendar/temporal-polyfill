import { diffDateTimes, diffZonedEpochNano } from './diff'
import {
  DurationFields,
  DurationInternals,
  durationFieldDefaults,
  durationFieldNamesAsc,
  durationFieldsToNano,
  durationFieldsToTimeNano,
  durationTimeFieldDefaults,
  nanoToDurationFields,
  timeNanoToDurationFields,
  updateDurationFieldsSign,
} from './durationFields'
import { IsoDateFields, IsoTimeFields, isoTimeFieldDefaults, IsoDateTimeFields } from './isoFields'
import { IsoDateInternals } from './isoInternals'
import { isoTimeFieldsToNano, isoToEpochNano, nanoToIsoTimeAndDay } from './isoMath'
import { LargeInt } from './largeInt'
import { moveDateByDays, moveDateTime, moveZonedEpochNano } from './move'
import { Overflow, RoundingMode, roundingModeFuncs } from './options'
import { TimeZoneOps, computeNanosecondsInDay } from './timeZoneOps'
import {
  nanoInMinute,
  nanoInUtcDay,
  unitNanoMap,
  Unit,
  DayTimeUnit,
  TimeUnit,
} from './units'
import { NumSign, identityFunc } from './utils'
import { ZonedInternals } from './zonedDateTime'

export function roundToMinute(offsetNano: number): number {
  return roundByInc(offsetNano, nanoInMinute, RoundingMode.HalfEven)
}

// Rounding Dates
// -------------------------------------------------------------------------------------------------

export function roundDateTime(
  isoFields: IsoDateTimeFields,
  smallestUnit: DayTimeUnit,
  roundingInc: number,
  roundingMode: RoundingMode,
  timeZoneOps?: TimeZoneOps | undefined,
) {
  if (smallestUnit === Unit.Day) {
    return roundDateTimeToDay(isoFields, timeZoneOps, roundingMode)
  }

  return roundDateTimeToNano(
    isoFields,
    computeNanoInc(smallestUnit, roundingInc),
    roundingMode,
  )
}

export function roundTime(
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

function roundDateTimeToDay(
  isoFields: IsoDateTimeFields,
  timeZoneOps: TimeZoneOps | undefined,
  roundingMode: RoundingMode,
): IsoDateTimeFields {
  const nanoInDay = timeZoneOps
    ? computeNanosecondsInDay(timeZoneOps, isoFields)
    : nanoInUtcDay

  const dayDelta = roundByInc(
    isoTimeFieldsToNano(isoFields),
    nanoInDay,
    roundingMode,
  )

  return {
    ...moveDateByDays(isoFields, dayDelta),
    ...isoTimeFieldDefaults,
  }
}

export function roundDateTimeToNano(
  isoFields: IsoDateTimeFields,
  nanoInc: number,
  roundingMode: RoundingMode,
): IsoDateTimeFields {
  const [roundedIsoFields, dayDelta] = roundTimeToNano(isoFields, nanoInc, roundingMode)

  return {
    ...moveDateByDays(isoFields, dayDelta),
    ...roundedIsoFields,
  }
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

// Rounding Duration
// -------------------------------------------------------------------------------------------------

export function roundDayTimeDuration(
  durationFields: DurationFields,
  smallestUnit: DayTimeUnit,
  roundingInc: number,
  roundingMode: RoundingMode,
): DurationFields {
  return roundDurationToNano(
    durationFields,
    computeNanoInc(smallestUnit, roundingInc),
    roundingMode,
  )
}

/*
Only does day-time rounding
*/
export function roundDurationToNano(
  durationFields: DurationFields,
  nanoInc: number,
  roundingMode: RoundingMode,
): DurationFields {
  const largeNano = durationFieldsToNano(durationFields)
  const roundedLargeNano = roundByIncLarge(largeNano, nanoInc, roundingMode)
  const dayTimeFields = nanoToDurationFields(roundedLargeNano)

  return {
    ...durationFields,
    ...dayTimeFields,
    days: durationFields.days + dayTimeFields.days,
  }
}

export function roundRelativeDuration<M>(
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  // ^has sign
  endEpochNano: LargeInt,
  largestUnit: Unit,
  smallestUnit: Unit,
  roundingInc: number,
  roundingMode: RoundingMode,
  // marker system...
  marker: M,
  markerToEpochNano: MarkerToEpochNano<M>,
  moveMarker: MoveMarker<M>,
): DurationFields {
  if (smallestUnit === Unit.Nanosecond && roundingInc === 1) {
    return durationFields
  }

  const nudgeFunc = (
    smallestUnit >= Unit.Day
      ? nudgeRelativeDuration
      : markerToEpochNano === identityFunc // marker is ZonedDateTime's epochNanoseconds?
        ? nudgeRelativeDurationTime
        : nudgeDurationTime
  ) as typeof nudgeRelativeDuration // accept all units

  let [roundedDurationFields, roundedEpochNano, grew] = nudgeFunc(
    updateDurationFieldsSign(durationFields),
    endEpochNano,
    smallestUnit,
    roundingInc,
    roundingMode,
    // marker system only needed for nudgeRelativeDuration...
    marker,
    markerToEpochNano,
    moveMarker,
  )

  // grew a day/week/month/year?
  if (grew) {
    roundedDurationFields = bubbleRelativeDuration(
      updateDurationFieldsSign(roundedDurationFields),
      roundedEpochNano,
      largestUnit,
      smallestUnit,
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

export function roundByIncLarge(
  num: LargeInt,
  inc: number,
  roundingMode: RoundingMode,
): LargeInt {
  const [whole, remainder] = num.divTruncMod(inc)
  const mod2 = whole.mod2() // workaround for halfEven

  return whole.mult(inc).addNumber(
    roundWithMode((remainder / inc) + mod2, roundingMode) - mod2,
  )
}

function roundWithMode(num: number, roundingMode: RoundingMode): number {
  return roundingModeFuncs[roundingMode](num)
}

// Total Duration
// -------------------------------------------------------------------------------------------------

export function totalDayTimeDuration( // assumes iso-length days
  durationFields: DurationFields,
  totalUnit: DayTimeUnit,
): number {
  const largeNano = durationFieldsToNano(durationFields)
  const divisor = unitNanoMap[totalUnit]
  const [fullUnits, remainder] = largeNano.divTruncMod(divisor)
  return fullUnits.toNumber() + (remainder / divisor)
}

export function totalRelativeDuration<M>(
  durationFields: DurationInternals, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: LargeInt,
  totalUnit: Unit,
  // marker system...
  marker: M,
  markerToEpochNano: MarkerToEpochNano<M>,
  moveMarker: MoveMarker<M>,
): number {
  const { sign } = durationFields

  const [epochNano0, epochNano1] = clampRelativeDuration(
    clearDurationFields(durationFields, totalUnit - 1),
    totalUnit,
    sign,
    // marker system...
    marker,
    markerToEpochNano,
    moveMarker,
  )

  const portion =
    endEpochNano.addLargeInt(epochNano0, -1).toNumber() /
    epochNano1.addLargeInt(epochNano0, -1).toNumber()

  return durationFields[durationFieldNamesAsc[totalUnit]] + portion
}

// Nudge
// -------------------------------------------------------------------------------------------------
/*
These functions actually do the heavy-lifting of rounding to a higher/lower marker,
and return the (day) delta. Also return the (potentially) unbalanced new duration.
*/

function nudgeDurationTime(
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: LargeInt, // NOT NEEDED, just for adding result to
  smallestUnit: TimeUnit,
  roundingInc: number,
  roundingMode: RoundingMode,
): [
  nudgedDurationFields: DurationFields,
  nudgedEpochNano: LargeInt,
  dayDelta: number,
] {
  const timeNano = durationFieldsToTimeNano(durationFields)
  const nanoInc = computeNanoInc(smallestUnit, roundingInc)
  const roundedTimeNano = roundByInc(timeNano, nanoInc, roundingMode)
  const roundedFields = timeNanoToDurationFields(roundedTimeNano)
  const dayDelta = roundedFields.days
  const nudgedDurationFields = { // TODO: what about sign?
    ...durationFields,
    ...roundedFields,
    days: durationFields.days + dayDelta,
  }

  return [
    nudgedDurationFields,
    endEpochNano.addNumber(roundedTimeNano - timeNano),
    dayDelta,
  ]
}

function nudgeRelativeDurationTime<M>(
  durationFields: DurationInternals, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: LargeInt, // NOT NEEDED, just for conformance
  smallestUnit: TimeUnit,
  roundingInc: number,
  roundingMode: RoundingMode,
  // marker system...
  marker: M,
  markerToEpochNano: MarkerToEpochNano<M>,
  moveMarker: MoveMarker<M>,
): [
  nudgedDurationFields: DurationFields,
  nudgedEpochNano: LargeInt,
  dayDelta: number,
] {
  const { sign } = durationFields
  const timeNano = durationFieldsToTimeNano(durationFields)
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

  const daySpanEpochNanoseconds = dayEpochNano1.addLargeInt(dayEpochNano0, -1).toNumber()
  const beyondDay = roundedTimeNano - daySpanEpochNanoseconds
  let dayDelta = 0

  if (!beyondDay || Math.sign(beyondDay) === sign) {
    dayDelta++
    roundedTimeNano = roundByInc(beyondDay, nanoInc, roundingMode)
    endEpochNano = dayEpochNano1.addNumber(roundedTimeNano)
  } else {
    endEpochNano = dayEpochNano0.addNumber(roundedTimeNano)
  }

  const durationTimeFields = timeNanoToDurationFields(roundedTimeNano)
  const nudgedDurationFields = {
    ...durationFields,
    ...durationTimeFields,
    days: durationFields.days + dayDelta,
  }

  return [nudgedDurationFields, endEpochNano, dayDelta]
}

function nudgeRelativeDuration<M>(
  durationFields: DurationInternals, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: LargeInt,
  smallestUnit: Unit,
  roundingInc: number,
  roundingMode: RoundingMode,
  // marker system...
  marker: M,
  markerToEpochNano: MarkerToEpochNano<M>,
  moveMarker: MoveMarker<M>,
): [
  durationFields: DurationFields,
  movedEpochNano: LargeInt,
  grew: NumSign,
] {
  const { sign } = durationFields
  const smallestUnitFieldName = durationFieldNamesAsc[smallestUnit]

  const baseDurationFields = clearDurationFields(durationFields, smallestUnit - 1)
  baseDurationFields[smallestUnitFieldName] = Math.trunc(
    durationFields[smallestUnitFieldName] / roundingInc,
  ) || 0 // ensure no -0

  const [epochNano0, epochNano1] = clampRelativeDuration(
    baseDurationFields,
    smallestUnit,
    roundingInc * sign,
    // marker system...
    marker,
    markerToEpochNano,
    moveMarker,
  )

  const portion =
    endEpochNano.addLargeInt(epochNano0, -1).toNumber() /
    epochNano1.addLargeInt(epochNano0, -1).toNumber()

  const roundedPortion = roundWithMode(portion * sign, roundingMode) // -1/0/1

  if (roundedPortion) { // enlarged?
    baseDurationFields[smallestUnitFieldName] += roundingInc * sign

    return [baseDurationFields, epochNano1, roundedPortion as NumSign]
  } else {
    return [baseDurationFields, epochNano0, 0]
  }
}

// Marker System
// -------------------------------------------------------------------------------------------------
// TODO: best place for this?

export type MarkerToEpochNano<M> = (marker: M) => LargeInt
export type MoveMarker<M> = (marker: M, durationFields: DurationFields) => M
export type DiffMarkers<M> = (marker0: M, marker1: M, largeUnit: Unit) => DurationInternals
export type MarkerSystem<M> = [
  M,
  MarkerToEpochNano<M>,
  MoveMarker<M>,
  DiffMarkers<M>,
]
export type SimpleMarkerSystem<M> = [
  M,
  MarkerToEpochNano<M>,
  MoveMarker<M>,
]

/*
Okay that callers frequently cast to `unknown`?
FYI: input can be a PlainDate's internals (IsoDateInternals), but marker has time
*/
export function createMarkerSystem(
  markerInternals: ZonedInternals | IsoDateInternals
): MarkerSystem<LargeInt> | MarkerSystem<IsoDateTimeFields> {
  const { calendar, timeZone, epochNanoseconds } = markerInternals as ZonedInternals

  if (epochNanoseconds) {
    return [
      epochNanoseconds,
      identityFunc as MarkerToEpochNano<LargeInt>,
      moveZonedEpochNano.bind(undefined, calendar, timeZone) as MoveMarker<LargeInt>,
      diffZonedEpochNano.bind(undefined, calendar, timeZone) as DiffMarkers<LargeInt>,
    ]
  } else {
    return [
      { ...markerInternals, ...isoTimeFieldDefaults } as IsoDateTimeFields,
      isoToEpochNano as MarkerToEpochNano<IsoDateTimeFields>,
      // TODO: better way to .bind to Calendar
      (m: IsoDateTimeFields, d: DurationFields) => {
        return moveDateTime(calendar, m, d)
      },
      (m0: IsoDateTimeFields, m1: IsoDateTimeFields, largeUnit: Unit) => {
        return updateDurationFieldsSign(diffDateTimes(calendar, m0, m1, largeUnit))
      },
    ]
  }
}

// Utils
// -------------------------------------------------------------------------------------------------

function bubbleRelativeDuration<M>(
  durationFields: DurationInternals, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: LargeInt,
  largestUnit: Unit,
  smallestUnit: Unit,
  // marker system...
  marker: M,
  markerToEpochNano: MarkerToEpochNano<M>,
  moveMarker: MoveMarker<M>,
): DurationFields {
  const { sign } = durationFields

  for (
    let currentUnit: Unit = smallestUnit + 1;
    currentUnit < largestUnit;
    currentUnit++
  ) {
    if (currentUnit === Unit.Week) { // correct?
      continue
    }

    const baseDurationFields = clearDurationFields(durationFields, currentUnit - 1)
    baseDurationFields[durationFieldNamesAsc[currentUnit]] += sign

    const thresholdEpochNano = markerToEpochNano(
      moveMarker(marker, baseDurationFields),
    )

    const beyondThreshold = endEpochNano.addLargeInt(thresholdEpochNano, -1).toNumber()
    if (!beyondThreshold || Math.sign(beyondThreshold) === sign) {
      durationFields = updateDurationFieldsSign(baseDurationFields)
    } else {
      break
    }
  }

  return durationFields
}

function clampRelativeDuration<M>(
  durationFields: DurationFields,
  clampUnit: Unit,
  clampDistance: number,
  // marker system...
  marker: M,
  markerToEpochNano: MarkerToEpochNano<M>,
  moveMarker: MoveMarker<M>,
) {
  const clampDurationFields = {
    ...durationFieldDefaults,
    [durationFieldNamesAsc[clampUnit]]: clampDistance,
  }
  const marker0 = moveMarker(marker, durationFields)
  const marker1 = moveMarker(marker0, clampDurationFields)
  const epochNano0 = markerToEpochNano(marker0)
  const epochNano1 = markerToEpochNano(marker1)
  return [epochNano0, epochNano1]
}

function clearDurationFields(
  durationFields: DurationFields,
  largestUnitToClear: Unit,
): DurationFields {
  const copy = { ...durationFields }

  for (let unit: Unit = Unit.Nanosecond; unit <= largestUnitToClear; unit++) {
    copy[durationFieldNamesAsc[unit]] = 0
  }

  return copy
}
