import { BigNano, bigNanoToNumber, diffBigNanos } from './bigNano'
import {
  nativeDateAdd,
  nativeDateUntil,
} from './calendarNativeMath'
import {
  DurationFields,
  clearDurationFields,
  durationFieldNamesAsc,
} from './durationFields'
import {
  computeDurationSign,
  durationFieldsToBigNano,
  getMaxDurationUnit,
} from './durationMath'
import * as errorMessages from './errorMessages'
import { IsoDateTimeFields } from './isoFields'
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
  isZonedEpochSlots,
} from './markerSystem'
import { DurationTotalOptions, refineTotalOptions } from './optionsRefine'
import { DurationSlots } from './slots'
import { checkIsoDateTimeInBounds } from './timeMath'
import { DayTimeUnit, Unit, UnitName, unitNanoMap } from './units'

export function totalDuration<RA>(
  refineRelativeTo: (relativeToArg?: RA) => RelativeToSlots | undefined,
  slots: DurationSlots,
  options: UnitName | DurationTotalOptions<RA>,
): number {
  const maxDurationUnit = getMaxDurationUnit(slots)
  const [totalUnit, relativeToSlots] = refineTotalOptions(
    options,
    refineRelativeTo,
  )
  const maxUnit = Math.max(totalUnit, maxDurationUnit)

  // NEW: short-circuit
  if (!relativeToSlots && isUniformUnit(maxUnit, relativeToSlots)) {
    return totalDayTimeDuration(slots, totalUnit as DayTimeUnit)
  }

  if (!relativeToSlots) {
    throw new RangeError(errorMessages.missingRelativeTo)
  }

  // NEW: short-circuit
  if (!slots.sign) {
    return 0
  }

  const [marker, nativeTimeZone] = createMarkerSystem(relativeToSlots)
  const markerToEpochNano = createMarkerToEpochNano(nativeTimeZone)
  const moveMarker = createMoveMarker(nativeTimeZone, relativeToSlots.calendar)
  const diffMarkers = createDiffMarkers(nativeTimeZone, relativeToSlots.calendar)

  const endMarker = moveMarker(marker, slots)

  // sanitize start/end markers
  // see DifferencePlainDateTimeWithRounding
  if (!isZonedEpochSlots(relativeToSlots)) {
    checkIsoDateTimeInBounds(marker as IsoDateTimeFields)
    checkIsoDateTimeInBounds(endMarker as IsoDateTimeFields)
  }

  const balancedDuration = diffMarkers(marker, endMarker, totalUnit)

  if (isUniformUnit(totalUnit, relativeToSlots)) {
    return totalDayTimeDuration(balancedDuration, totalUnit as DayTimeUnit)
  }

  return totalRelativeDuration(
    balancedDuration,
    markerToEpochNano(endMarker),
    totalUnit,
    marker,
    markerToEpochNano,
    moveMarker,
  )
}

export function totalRelativeDuration(
  durationFields: DurationFields,
  endEpochNano: BigNano,
  totalUnit: Unit, // always >=Day
  marker: Marker,
  markerToEpochNano: MarkerToEpochNano,
  moveMarker: MoveMarker,
): number {
  const sign = computeDurationSign(durationFields)
  const [epochNano0, epochNano1] = clampRelativeDuration(
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
  durationFields: DurationFields,
  clampUnit: Unit, // always >=Day
  clampDistance: number,
  marker: Marker,
  markerToEpochNano: MarkerToEpochNano,
  moveMarker: MoveMarker,
) {
  const unitName = durationFieldNamesAsc[clampUnit]
  const durationPlusDistance = {
    ...durationFields,
    [unitName]: durationFields[unitName] + clampDistance,
  }

  const marker0 = moveMarker(marker, durationFields)
  const marker1 = moveMarker(marker, durationPlusDistance)
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
