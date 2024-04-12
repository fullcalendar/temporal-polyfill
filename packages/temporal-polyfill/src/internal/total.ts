import { BigNano, bigNanoToNumber, diffBigNanos } from './bigNano'
import { DiffOps, MoveOps } from './calendarOps'
import {
  DurationFields,
  clearDurationFields,
  durationFieldDefaults,
  durationFieldNamesAsc,
} from './durationFields'
import {
  computeDurationSign,
  durationFieldsToBigNano,
  getMaxDurationUnit,
  spanDuration,
} from './durationMath'
import * as errorMessages from './errorMessages'
import {
  Marker,
  MarkerToEpochNano,
  MoveMarker,
  RelativeToSlots,
  createDiffMarkers,
  createMarkerSystem,
  createMarkerToEpochNano,
  createMoveMarker,
  isUniformUnit,
} from './markerSystem'
import { DurationTotalOptions, refineTotalOptions } from './optionsRefine'
import { DurationSlots } from './slots'
import { TimeZoneOps } from './timeZoneOps'
import { DayTimeUnit, Unit, UnitName, unitNanoMap } from './units'

export function totalDuration<RA, C, T>(
  refineRelativeTo: (relativeToArg?: RA) => RelativeToSlots<C, T> | undefined,
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  slots: DurationSlots,
  options: UnitName | DurationTotalOptions<RA>,
): number {
  const maxDurationUnit = getMaxDurationUnit(slots)
  const [totalUnit, relativeToSlots] = refineTotalOptions(
    options,
    refineRelativeTo,
  )
  const maxUnit = Math.max(totalUnit, maxDurationUnit)

  if (isUniformUnit(maxUnit, relativeToSlots)) {
    return totalDayTimeDuration(slots, totalUnit as DayTimeUnit)
  }

  if (!relativeToSlots) {
    throw new RangeError(errorMessages.missingRelativeTo)
  }

  const [marker, calendarOps, timeZoneOps] = createMarkerSystem(
    getCalendarOps,
    getTimeZoneOps,
    relativeToSlots,
  )
  const markerToEpochNano = createMarkerToEpochNano(timeZoneOps)
  const moveMarker = createMoveMarker(timeZoneOps)
  const diffMarkers = createDiffMarkers(timeZoneOps)

  const [balancedDuration, endMarker] = spanDuration(
    calendarOps,
    slots,
    totalUnit,
    marker,
    moveMarker,
    diffMarkers,
  )

  return totalRelativeDuration(
    balancedDuration,
    markerToEpochNano(endMarker),
    totalUnit,
    calendarOps,
    marker,
    markerToEpochNano,
    moveMarker,
  )
}

export function totalRelativeDuration(
  durationFields: DurationFields,
  endEpochNano: BigNano,
  totalUnit: Unit,
  calendarOps: MoveOps,
  marker: Marker,
  markerToEpochNano: MarkerToEpochNano,
  moveMarker: MoveMarker,
): number {
  const sign = computeDurationSign(durationFields)
  const [epochNano0, epochNano1] = clampRelativeDuration(
    calendarOps,
    clearDurationFields(totalUnit, durationFields),
    totalUnit,
    sign,
    marker,
    markerToEpochNano,
    moveMarker,
  )
  const frac = computeEpochNanoFrac(endEpochNano, epochNano0, epochNano1)
  return durationFields[durationFieldNamesAsc[totalUnit]] + frac * sign
}

function totalDayTimeDuration(
  durationFields: DurationFields,
  totalUnit: DayTimeUnit,
): number {
  return bigNanoToNumber(
    durationFieldsToBigNano(durationFields),
    unitNanoMap[totalUnit],
    true, // exact
  )
}

// Utils for points-within-intervals
// -----------------------------------------------------------------------------

export function clampRelativeDuration(
  calendarOps: MoveOps,
  durationFields: DurationFields,
  clampUnit: Unit,
  clampDistance: number,
  marker: Marker,
  markerToEpochNano: MarkerToEpochNano,
  moveMarker: MoveMarker,
) {
  const clampDurationFields = {
    ...durationFieldDefaults,
    [durationFieldNamesAsc[clampUnit]]: clampDistance,
  }
  const marker0 = moveMarker(calendarOps, marker, durationFields)
  const marker1 = moveMarker(calendarOps, marker0, clampDurationFields)
  const epochNano0 = markerToEpochNano(marker0)
  const epochNano1 = markerToEpochNano(marker1)
  return [epochNano0, epochNano1]
}

export function computeEpochNanoFrac(
  epochNanoProgress: BigNano,
  epochNano0: BigNano,
  epochNano1: BigNano,
): number {
  const denom = bigNanoToNumber(diffBigNanos(epochNano0, epochNano1))
  if (!denom) {
    throw new RangeError(errorMessages.invalidProtocolResults)
  }
  const number = bigNanoToNumber(diffBigNanos(epochNano0, epochNanoProgress))
  return number / denom
}
