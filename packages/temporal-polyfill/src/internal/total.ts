import { BigNano, bigNanoToNumber, diffBigNanos } from './bigNano'
import { DiffOps } from './calendarOps'
import {
  DurationFields,
  clearDurationFields,
  durationFieldDefaults,
  durationFieldNamesAsc,
} from './durationFields'
import {
  computeDurationSign,
  durationFieldsToBigNano,
  getLargestDurationUnit,
  spanDuration,
} from './durationMath'
import * as errorMessages from './errorMessages'
import {
  DiffMarkers,
  Marker,
  MarkerToEpochNano,
  MoveMarker,
  RelativeToSlots,
  createMarkerDiffSystem,
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
  const durationLargestUnit = getLargestDurationUnit(slots)
  const [totalUnit, relativeToSlots] = refineTotalOptions(
    options,
    refineRelativeTo,
  )
  const maxUnit = Math.max(totalUnit, durationLargestUnit)

  if (isUniformUnit(maxUnit, relativeToSlots)) {
    return totalDayTimeDuration(slots, totalUnit as DayTimeUnit)
  }

  if (!relativeToSlots) {
    throw new RangeError(errorMessages.missingRelativeTo)
  }

  const diffSystem = createMarkerDiffSystem(
    getCalendarOps,
    getTimeZoneOps,
    relativeToSlots,
  )

  return totalRelativeDuration(
    ...spanDuration(slots, totalUnit, ...diffSystem),
    totalUnit,
    ...diffSystem,
  )
}

export function totalRelativeDuration(
  durationFields: DurationFields,
  endEpochNano: BigNano,
  totalUnit: Unit,
  // MarkerDiffSystem...
  marker: Marker,
  markerToEpochNano: MarkerToEpochNano,
  moveMarker: MoveMarker,
  _diffMarkers?: DiffMarkers,
): number {
  const sign = computeDurationSign(durationFields)
  const [epochNano0, epochNano1] = clampRelativeDuration(
    clearDurationFields(totalUnit, durationFields),
    totalUnit,
    sign,
    // MarkerSystem...
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
  durationFields: DurationFields,
  clampUnit: Unit,
  clampDistance: number,
  // MarkerMoveSystem...
  marker: Marker,
  markerToEpochNano: MarkerToEpochNano,
  moveMarker: MoveMarker,
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
