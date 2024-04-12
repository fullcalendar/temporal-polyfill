import { BigNano, bigNanoToNumber, diffBigNanos } from './bigNano'
import { DiffOps, MoveOps } from './calendarOps'
import {
  DurationFields,
  clearDurationFields,
  durationFieldDefaults,
  durationFieldNamesAsc,
  durationTimeFieldDefaults,
} from './durationFields'
import {
  balanceDuration,
  computeDurationSign,
  durationFieldsToBigNano,
  getMaxDurationUnit,
} from './durationMath'
import * as errorMessages from './errorMessages'
import { IsoDateTimeFields } from './isoFields'
import {
  RelativeToSlots,
  createMarkerSystem,
  isUniformUnit,
  joinIsoDateAndTime,
  markerIsoDateTimeToEpochNano,
} from './markerSystem'
import { moveDate } from './move'
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

  const [balancedDuration, startIsoDateTime, endEpochNano] = balanceDuration(
    calendarOps,
    timeZoneOps,
    marker,
    slots,
    totalUnit,
    false, // viaWeeks... TODO: stripe out functionality for tree-shaking
  )

  return totalRelativeDuration(
    balancedDuration,
    endEpochNano,
    totalUnit,
    calendarOps,
    timeZoneOps,
    startIsoDateTime,
  )
}

export function totalRelativeDuration(
  durationFields: DurationFields,
  endEpochNano: BigNano,
  totalUnit: Unit, // guaranteed >=Day
  calendarOps: MoveOps,
  timeZoneOps: TimeZoneOps | undefined,
  startIsoDateTime: IsoDateTimeFields,
): number {
  const sign = computeDurationSign(durationFields)
  const [epochNano0, epochNano1] = clampRelativeDuration(
    clearDurationFields(totalUnit, durationFields),
    totalUnit,
    sign,
    calendarOps,
    timeZoneOps,
    startIsoDateTime,
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
  baseDurationFields: DurationFields, // guaranteed no time fields
  clampUnit: Unit, // guaranteed >=Day
  clampDistance: number,
  calendarOps: MoveOps,
  timeZoneOps: TimeZoneOps | undefined,
  startIsoDateTime: IsoDateTimeFields,
) {
  const clampDurationFields = {
    ...durationFieldDefaults,
    [durationFieldNamesAsc[clampUnit]]: clampDistance,
  }

  const windowIsoDate0 = moveDate(calendarOps, startIsoDateTime, {
    ...baseDurationFields,
    ...durationTimeFieldDefaults, // no time bubble-up
  })
  const windowIsoDate1 = moveDate(
    calendarOps,
    windowIsoDate0,
    clampDurationFields,
  )
  const windowIsoDateTime0 = joinIsoDateAndTime(
    windowIsoDate0,
    startIsoDateTime,
  )
  const windowIsoDateTime1 = joinIsoDateAndTime(
    windowIsoDate1,
    startIsoDateTime,
  )

  return [
    markerIsoDateTimeToEpochNano(timeZoneOps, windowIsoDateTime0),
    markerIsoDateTimeToEpochNano(timeZoneOps, windowIsoDateTime1),
  ]
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
