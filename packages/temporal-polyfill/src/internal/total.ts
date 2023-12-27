import { DayTimeNano, dayTimeNanoToNumber, diffDayTimeNanos } from './dayTimeNano'
import { DayTimeUnit, Unit, UnitName, unitNanoMap } from './units'
import { DurationFields, durationFieldsToDayTimeNano, durationFieldNamesAsc, clearDurationFields } from './durationFields'
import { DiffOps } from './calendarOps'
import { TimeZoneOps } from './timeZoneOps'
import { DurationSlots } from './slots'
import { TotalUnitOptionsWithRel, refineTotalOptions } from '../genericApi/optionsRefine'
import { clampRelativeDuration } from './round'
import { MarkerSlots, getLargestDurationUnit, createMarkerSystem, MarkerSystem, spanDuration, MarkerToEpochNano, MoveMarker, DiffMarkers, queryDurationSign } from './durationMath'

export function totalDuration<RA, C, T>(
  refineRelativeTo: (relativeToArg: RA) => MarkerSlots<C, T> | undefined,
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  slots: DurationSlots,
  options: TotalUnitOptionsWithRel<RA> | UnitName
): number {
  const durationLargestUnit = getLargestDurationUnit(slots)
  const [totalUnit, markerSlots] = refineTotalOptions(options, refineRelativeTo)
  const maxLargestUnit = Math.max(totalUnit, durationLargestUnit)

  if (maxLargestUnit < Unit.Day || (
    maxLargestUnit === Unit.Day &&
    // has uniform days?
    !(markerSlots && (markerSlots as any).epochNanoseconds)
  )) {
    return totalDayTimeDuration(slots, totalUnit as DayTimeUnit)
  }

  if (!markerSlots) {
    throw new RangeError('need relativeTo')
  }

  const markerSystem = createMarkerSystem(getCalendarOps, getTimeZoneOps, markerSlots) as MarkerSystem<any>

  return totalRelativeDuration(
    ...spanDuration(slots, undefined, totalUnit, ...markerSystem),
    totalUnit,
    ...markerSystem
  )
}

function totalDayTimeDuration(
  durationFields: DurationFields,
  totalUnit: DayTimeUnit
): number {
  return totalDayTimeNano(
    durationFieldsToDayTimeNano(durationFields, Unit.Day),
    totalUnit
  )
}

function totalRelativeDuration<M>(
  durationFields: DurationFields,
  endEpochNano: DayTimeNano,
  totalUnit: Unit,
  // marker system...
  marker: M,
  markerToEpochNano: MarkerToEpochNano<M>,
  moveMarker: MoveMarker<M>,
  diffMarkers?: DiffMarkers<M>
): number {
  const sign = queryDurationSign(durationFields)

  const [epochNano0, epochNano1] = clampRelativeDuration(
    clearDurationFields(durationFields, totalUnit - 1),
    totalUnit,
    sign,
    // marker system...
    marker,
    markerToEpochNano,
    moveMarker
  )

  // TODO: more DRY
  const frac = dayTimeNanoToNumber(diffDayTimeNanos(epochNano0, endEpochNano)) /
    dayTimeNanoToNumber(diffDayTimeNanos(epochNano0, epochNano1))
  if (!Number.isFinite(frac)) {
    throw new RangeError('Faulty Calendar rounding')
  }

  return durationFields[durationFieldNamesAsc[totalUnit]] + frac * sign
}

export function totalDayTimeNano(
  dayTimeNano: DayTimeNano,
  totalUnit: DayTimeUnit,
): number {
  return dayTimeNanoToNumber(dayTimeNano, unitNanoMap[totalUnit], true) // exact
}
