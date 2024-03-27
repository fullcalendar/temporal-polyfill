/*
WIP. Ultimately for funcApi
*/
import { bigNanoToNumber, compareBigNanos, diffBigNanos } from './bigNano'
import { createNativeDiffOps, createNativeMoveOps } from './calendarNativeQuery'
import {
  diffByDay,
  diffByWeek,
  getCommonCalendarSlot,
  getCommonTimeZoneSlot,
  zonedEpochRangeToIso,
} from './diff'
import { DurationFields } from './durationFields'
import { IsoDateFields } from './isoFields'
import { Marker, MarkerToEpochNano, MoveMarker } from './markerSystem'
import { moveDateTime, moveZonedEpochSlots } from './move'
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
import {
  TimeUnit,
  Unit,
  nanoInHour,
  nanoInMicro,
  nanoInMilli,
  nanoInMinute,
  nanoInSec,
} from './units'
import { NumberSign, bindArgs } from './utils'

// Utils: Large Units (years, months)
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
    bindArgs(moveZonedEpochSlots, calendarOps, timeZoneOps) as MoveMarker,
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

// Utils: Day-Like Units (weeks, days)
// -----------------------------------------------------------------------------

function diffZonedDayLikeUnits(
  diffIsoFields: (f0: IsoDateFields, f1: IsoDateFields) => DurationFields,
  unit: Unit,
  record0: ZonedDateTimeSlots<string, string>,
  record1: ZonedDateTimeSlots<string, string>,
  options: RoundingModeName | RoundingMathOptions | undefined,
) {
  const timeZoneSlot = getCommonTimeZoneSlot(record0.timeZone, record1.timeZone)
  const timeZoneOps = queryNativeTimeZone(timeZoneSlot)

  const calendarSlot = getCommonCalendarSlot(record0.calendar, record1.calendar)
  const calendarOps = createNativeMoveOps(calendarSlot)

  return diffDateUnits(
    extractEpochNano as MarkerToEpochNano,
    bindArgs(zonedEpochRangeToIso, timeZoneOps) as MarkersToIsoFields,
    bindArgs(moveZonedEpochSlots, calendarOps, timeZoneOps) as MoveMarker,
    diffIsoFields,
    unit,
    record0,
    record1,
    options,
  )
}

function diffPlainDayLikeUnits<S extends DateSlots<string>>(
  diffIsoFields: (f0: IsoDateFields, f1: IsoDateFields) => DurationFields,
  unit: Unit,
  record0: S,
  record1: S,
  options: RoundingModeName | RoundingMathOptions | undefined,
) {
  const calendarSlot = getCommonCalendarSlot(record0.calendar, record1.calendar)
  const calendarOps = createNativeMoveOps(calendarSlot)

  return diffDateUnits(
    isoToEpochNano as MarkerToEpochNano,
    identityMarkersToIsoFields as MarkersToIsoFields,
    bindArgs(moveDateTime, calendarOps) as MoveMarker,
    diffIsoFields,
    unit,
    record0,
    record1,
    options,
  )
}

// Utils: Date Units (years, months, weeks, days)
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

// Utils: Time Units
// -----------------------------------------------------------------------------

const diffZonedTimeUnits = bindArgs(
  diffTimeUnits,
  extractEpochNano as MarkerToEpochNano,
)

const diffPlainTimeUnits = bindArgs(
  diffTimeUnits,
  isoToEpochNano as MarkerToEpochNano,
)

function diffTimeUnits(
  markerToEpochNano: MarkerToEpochNano,
  nanoInUnit: number,
  unit: TimeUnit,
  record0: Marker,
  record1: Marker,
  options?: RoundingModeName | RoundingMathOptions,
) {
  const [roundingInc, roundingMode] = refineUnitDiffOptions(unit, options)

  let nanoDiff = diffBigNanos(
    markerToEpochNano(record0),
    markerToEpochNano(record1),
  )

  if (roundingInc) {
    nanoDiff = roundBigNanoByInc(
      nanoDiff,
      nanoInHour * roundingInc,
      roundingMode!,
    )
  }

  return bigNanoToNumber(nanoDiff, nanoInUnit, !roundingInc)
}

// -----------------------------------------------------------------------------

export const zdt_diffYears = bindArgs(diffZonedLargeUnits, Unit.Year)
export const zdt_diffMonths = bindArgs(diffZonedLargeUnits, Unit.Month)
export const zdt_diffWeeks = bindArgs(
  diffZonedDayLikeUnits,
  diffByWeek,
  Unit.Week,
)
export const zdt_diffDays = bindArgs(diffZonedDayLikeUnits, diffByDay, Unit.Day)
export const zdt_diffHours = bindArgs(diffZonedTimeUnits, nanoInHour, Unit.Hour)
export const zdt_diffMinutes = bindArgs(
  diffZonedTimeUnits,
  nanoInMinute,
  Unit.Minute,
)
export const zdt_diffSeconds = bindArgs(
  diffZonedTimeUnits,
  nanoInSec,
  Unit.Second,
)
export const zdt_diffMilliseconds = bindArgs(
  diffZonedTimeUnits,
  nanoInMilli,
  Unit.Millisecond,
)
export const zdt_diffMicroseconds = bindArgs(
  diffZonedTimeUnits,
  nanoInMicro,
  Unit.Microsecond,
)
export const zdt_diffNanoseconds = bindArgs(
  diffZonedTimeUnits,
  1,
  Unit.Nanosecond,
)

export const pd_or_pdt_diffYears = bindArgs(diffPlainLargeUnits, Unit.Year)
export const pd_or_pdt_diffMonths = bindArgs(diffPlainLargeUnits, Unit.Month)
export const pd_or_pdt_diffWeeks = bindArgs(
  diffPlainDayLikeUnits,
  diffByWeek,
  Unit.Week,
)
export const pd_or_pdt_diffDays = bindArgs(
  diffPlainDayLikeUnits,
  diffByDay,
  Unit.Day,
)

export const pdt_diffHours = bindArgs(diffPlainTimeUnits, nanoInHour, Unit.Hour)
export const pdt_diffMinutes = bindArgs(
  diffPlainTimeUnits,
  nanoInMinute,
  Unit.Minute,
)
export const pdt_diffSeconds = bindArgs(
  diffPlainTimeUnits,
  nanoInSec,
  Unit.Second,
)
export const pdt_diffMilliseconds = bindArgs(
  diffPlainTimeUnits,
  nanoInMilli,
  Unit.Millisecond,
)
export const pdt_diffMicroseconds = bindArgs(
  diffPlainTimeUnits,
  nanoInMicro,
  Unit.Microsecond,
)
export const pdt_diffNanoseconds = bindArgs(
  diffPlainTimeUnits,
  1,
  Unit.Nanosecond,
)
