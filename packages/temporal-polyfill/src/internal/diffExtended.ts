/*
WIP. Ultimately for funcApi
*/
import {
  bigNanoToNumber,
  compareBigNanos,
  diffBigNanos,
  moveBigNano,
} from './bigNano'
import { createNativeDiffOps } from './calendarNativeQuery'
import {
  getCommonCalendarSlot,
  getCommonTimeZoneSlot,
  zonedEpochRangeToIso,
} from './diff'
import { DurationFields } from './durationFields'
import { IsoDateFields } from './isoFields'
import { Marker, MarkerToEpochNano, MoveMarker } from './markerSystem'
import { moveDateTime, moveZonedEpochs } from './move'
import {
  RoundingMathOptions,
  RoundingModeName,
  refineUnitDiffOptions,
} from './optionsRefine'
import { roundBigNanoByInc, roundByInc } from './round'
import { DateSlots, ZonedDateTimeSlots, extractEpochNano } from './slots'
import { isoToEpochNano } from './timeMath'
import { queryNativeTimeZone } from './timeZoneNative'
import { totalRelativeDuration } from './total'
import { DayTimeUnit, Unit, nanoInUtcDay, nanoInUtcWeek } from './units'
import { NumberSign, bindArgs } from './utils'

export const diffZonedYears = bindArgs(diffZonedLargeUnits, Unit.Year)
export const diffZonedMonths = bindArgs(diffZonedLargeUnits, Unit.Month)
export const diffZonedWeeks = bindArgs(
  diffZonedDayLikeUnits,
  Unit.Week,
  nanoInUtcWeek,
)
export const diffZonedDays = bindArgs(
  diffZonedDayLikeUnits,
  Unit.Day,
  nanoInUtcDay,
)
export const diffZonedTimeUnits = bindArgs(
  diffDayTimeLikeUnit,
  extractEpochNano as MarkerToEpochNano,
)

export const diffPlainYears = bindArgs(diffPlainLargeUnits, Unit.Year)
export const diffPlainMonths = bindArgs(diffPlainLargeUnits, Unit.Month)
export const diffPlainWeeks = bindArgs(
  diffDayTimeLikeUnit,
  isoToEpochNano as MarkerToEpochNano,
  Unit.Week,
  nanoInUtcWeek,
)
export const diffPlainDays = bindArgs(
  diffDayTimeLikeUnit,
  isoToEpochNano as MarkerToEpochNano,
  Unit.Day,
  nanoInUtcDay,
)
export const diffPlainTimeUnits = bindArgs(
  diffDayTimeLikeUnit,
  isoToEpochNano as MarkerToEpochNano,
)

// Large Units (years, months)
// -----------------------------------------------------------------------------

function diffZonedLargeUnits(
  unit: Unit,
  record0: ZonedDateTimeSlots<string, string>,
  record1: ZonedDateTimeSlots<string, string>,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  const timeZoneSlot = getCommonTimeZoneSlot(record0.timeZone, record1.timeZone)
  const timeZoneOps = queryNativeTimeZone(timeZoneSlot)

  const calendarSlot = getCommonCalendarSlot(record0.calendar, record1.calendar)
  const calendarOps = createNativeDiffOps(calendarSlot)

  return diffDateUnits(
    extractEpochNano as MarkerToEpochNano,
    bindArgs(zonedEpochRangeToIso, timeZoneOps) as MarkersToIsoFields,
    bindArgs(moveZonedEpochs, calendarOps, timeZoneOps) as MoveMarker,
    (f0: IsoDateFields, f1: IsoDateFields) =>
      calendarOps.dateUntil(f0, f1, unit),
    unit,
    record0,
    record1,
    options,
  )
}

function diffPlainLargeUnits<S extends DateSlots<string>>(
  unit: Unit,
  record0: S,
  record1: S,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  const calendarSlot = getCommonCalendarSlot(record0.calendar, record1.calendar)
  const calendarOps = createNativeDiffOps(calendarSlot)

  return diffDateUnits(
    isoToEpochNano as MarkerToEpochNano,
    identityMarkersToIsoFields as MarkersToIsoFields,
    bindArgs(moveDateTime, calendarOps) as MoveMarker,
    (f0: IsoDateFields, f1: IsoDateFields) =>
      calendarOps.dateUntil(f0, f1, unit),
    unit,
    record0,
    record1,
    options,
  )
}

// Day/Time Units
// -----------------------------------------------------------------------------

function diffZonedDayLikeUnits(
  unit: Unit,
  nanoInUnit: number,
  record0: ZonedDateTimeSlots<string, string>,
  record1: ZonedDateTimeSlots<string, string>,
  options: RoundingModeName | RoundingMathOptions | undefined,
): number {
  const [roundingInc, roundingMode] = refineUnitDiffOptions(unit, options)

  const timeZoneSlot = getCommonTimeZoneSlot(record0.timeZone, record1.timeZone)
  const timeZoneOps = queryNativeTimeZone(timeZoneSlot)

  const sign = compareBigNanos(
    record1.epochNanoseconds,
    record0.epochNanoseconds,
  )
  const [isoFields0, isoFields1, timeDiff] = zonedEpochRangeToIso(
    timeZoneOps,
    record0,
    record1,
    sign,
  )
  let nanoDiff = moveBigNano(
    diffBigNanos(isoToEpochNano(isoFields0)!, isoToEpochNano(isoFields1)!),
    timeDiff,
  )

  if (roundingInc) {
    nanoDiff = roundBigNanoByInc(
      nanoDiff,
      nanoInUnit * roundingInc,
      roundingMode!,
    )
  }

  return bigNanoToNumber(nanoDiff, nanoInUnit, !roundingInc)
}

function diffDayTimeLikeUnit(
  markerToEpochNano: MarkerToEpochNano,
  unit: DayTimeUnit | Unit.Week,
  nanoInUnit: number,
  record0: Marker,
  record1: Marker,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  const [roundingInc, roundingMode] = refineUnitDiffOptions(unit, options)

  let nanoDiff = diffBigNanos(
    markerToEpochNano(record0),
    markerToEpochNano(record1),
  )

  if (roundingInc) {
    nanoDiff = roundBigNanoByInc(
      nanoDiff,
      nanoInUnit * roundingInc,
      roundingMode!,
    )
  }

  return bigNanoToNumber(nanoDiff, nanoInUnit, !roundingInc)
}

// Date Utils (years, months, weeks, days)
// -----------------------------------------------------------------------------

type MarkersToIsoFields = (
  m0: Marker,
  m1: Marker,
  sign: NumberSign,
) => [IsoDateFields, IsoDateFields, ...any[]]

function identityMarkersToIsoFields(
  m0: IsoDateFields,
  m1: IsoDateFields,
): [IsoDateFields, IsoDateFields] {
  return [m0, m1]
}

function diffDateUnits(
  markerToEpochNano: MarkerToEpochNano,
  markersToIsoFields: MarkersToIsoFields,
  moveMarker: MoveMarker,
  diffIsoFields: (f0: IsoDateFields, f1: IsoDateFields) => DurationFields,
  unit: Unit,
  marker0: Marker,
  marker1: Marker,
  options: RoundingModeName | RoundingMathOptions | undefined,
): number {
  const [roundingInc, roundingMode] = refineUnitDiffOptions(unit, options)
  const startEpochNano = markerToEpochNano(marker0)
  const endEpochNano = markerToEpochNano(marker1)

  const sign = compareBigNanos(endEpochNano, startEpochNano)
  if (!sign) {
    return 0
  }

  const [isoFields0, isoFields1] = markersToIsoFields(marker0, marker1, sign)
  const durationFields = diffIsoFields(isoFields0, isoFields1)

  let res = totalRelativeDuration(
    durationFields,
    endEpochNano,
    unit,
    // MarkerMoveSystem...
    marker0,
    markerToEpochNano,
    moveMarker,
  )

  if (roundingInc) {
    res = roundByInc(res, roundingInc, roundingMode!)
  }

  return res
}
