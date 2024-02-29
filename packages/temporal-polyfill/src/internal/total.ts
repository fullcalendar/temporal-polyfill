import { BigNano, bigNanoToNumber, diffBigNanos } from './bigNano'
import { DiffOps } from './calendarOps'
import {
  DurationFields,
  durationFieldDefaults,
  durationFieldNamesAsc,
} from './durationFields'
import {
  clearDurationFields,
  computeDurationSign,
  durationFieldsToBigNano,
  getLargestDurationUnit,
  spanDuration,
} from './durationMath'
import * as errorMessages from './errorMessages'
import { moveRelativeMarker } from './move'
import { TotalUnitOptionsWithRel, refineTotalOptions } from './optionsRefine'
import {
  RelativeMarkerSlots,
  RelativeToSlots,
  createRelativeSystem,
  relativeMarkerToEpochNano,
} from './relativeSystem'
import { DurationSlots } from './slots'
import { TimeZoneOps } from './timeZoneOps'
import { DayTimeUnit, Unit, UnitName, unitNanoMap } from './units'

export function totalDuration<RA, C, T>(
  refineRelativeTo: (relativeToArg?: RA) => RelativeToSlots<C, T> | undefined,
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  slots: DurationSlots,
  options: TotalUnitOptionsWithRel<RA> | UnitName,
): number {
  const durationLargestUnit = getLargestDurationUnit(slots)
  const [totalUnit, relativeToSlots] = refineTotalOptions(
    options,
    refineRelativeTo,
  )
  const maxLargestUnit = Math.max(totalUnit, durationLargestUnit)

  if (
    maxLargestUnit < Unit.Day ||
    (maxLargestUnit === Unit.Day &&
      !(relativeToSlots && (relativeToSlots as any).epochNanoseconds)) // has uniform days?
  ) {
    return totalDayTimeDuration(slots, totalUnit as DayTimeUnit)
  }

  if (!relativeToSlots) {
    throw new RangeError(errorMessages.missingRelativeTo)
  }

  const relativeSystem = createRelativeSystem(
    getCalendarOps,
    getTimeZoneOps,
    relativeToSlots,
  )

  return totalRelativeDuration(
    ...spanDuration(slots, undefined, totalUnit, ...relativeSystem),
    totalUnit,
    ...relativeSystem,
  )
}

function totalRelativeDuration(
  durationFields: DurationFields,
  endEpochNano: BigNano,
  totalUnit: Unit,
  // RelativeSystem...
  marker: RelativeMarkerSlots,
  calendarOps: DiffOps,
  timeZoneOps?: TimeZoneOps,
): number {
  const sign = computeDurationSign(durationFields)

  const [epochNano0, epochNano1] = clampRelativeDuration(
    clearDurationFields(durationFields, totalUnit - 1),
    totalUnit,
    sign,
    // RelativeSystem...
    marker,
    calendarOps,
    timeZoneOps,
  )

  const frac = computeEpochNanoFrac(epochNano0, epochNano1, endEpochNano)
  return durationFields[durationFieldNamesAsc[totalUnit]] + frac * sign
}

function totalDayTimeDuration(
  durationFields: DurationFields,
  totalUnit: DayTimeUnit,
): number {
  return totalBigNano(durationFieldsToBigNano(durationFields), totalUnit)
}

// Utils for points-within-intervals
// -----------------------------------------------------------------------------

export function totalBigNano(bigNano: BigNano, totalUnit: DayTimeUnit): number {
  return bigNanoToNumber(bigNano, unitNanoMap[totalUnit], true) // exact=true
}

export function clampRelativeDuration(
  durationFields: DurationFields,
  clampUnit: Unit,
  clampDistance: number,
  // RelativeSystem...
  marker: RelativeMarkerSlots,
  calendarOps: DiffOps,
  timeZoneOps?: TimeZoneOps,
) {
  const clampDurationFields = {
    ...durationFieldDefaults,
    [durationFieldNamesAsc[clampUnit]]: clampDistance,
  }
  const marker0 = moveRelativeMarker(
    durationFields,
    marker,
    calendarOps,
    timeZoneOps,
  )
  const marker1 = moveRelativeMarker(
    clampDurationFields,
    marker0,
    calendarOps,
    timeZoneOps,
  )
  const epochNano0 = relativeMarkerToEpochNano(marker0, timeZoneOps)
  const epochNano1 = relativeMarkerToEpochNano(marker1, timeZoneOps)
  return [epochNano0, epochNano1]
}

export function computeEpochNanoFrac(
  epochNano0: BigNano,
  epochNano1: BigNano,
  epochNanoProgress: BigNano,
): number {
  const denom = bigNanoToNumber(diffBigNanos(epochNano0, epochNano1))
  if (!denom) {
    throw new RangeError(errorMessages.invalidProtocolResults)
  }
  const numer = bigNanoToNumber(diffBigNanos(epochNano0, epochNanoProgress))
  return numer / denom
}
