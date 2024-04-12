import {
  bigNanoToExactDays,
  bigNanoToNumber,
  compareBigNanos,
  diffBigNanos,
  moveBigNano,
} from '../internal/bigNano'
import { createNativeDiffOps } from '../internal/calendarNativeQuery'
import { DiffOps } from '../internal/calendarOps'
import {
  diffDatesBig,
  getCommonCalendarSlot,
  getCommonTimeZoneSlot,
  prepareZonedEpochDiff,
} from '../internal/diff'
import {
  Marker,
  markerToEpochNano,
  markerToIsoDateTime,
  prepareMarkerIsoDateTimeDiff,
} from '../internal/markerSystem'
import {
  RoundingMathOptions,
  RoundingModeName,
  refineUnitDiffOptions,
} from '../internal/optionsRefine'
import { roundBigNanoByInc, roundByInc } from '../internal/round'
import { DateSlots, ZonedDateTimeSlots } from '../internal/slots'
import { isoToEpochNano } from '../internal/timeMath'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { TimeZoneOps } from '../internal/timeZoneOps'
import { totalRelativeDuration } from '../internal/total'
import { TimeUnit, Unit } from '../internal/units'
import { bindArgs } from '../internal/utils'

// TODO: better types

export const diffZonedYears = bindArgs(diffZonedLargeUnits, Unit.Year)
export const diffZonedMonths = bindArgs(diffZonedLargeUnits, Unit.Month)
export const diffZonedWeeks = bindArgs(diffZonedDayLikeUnits, Unit.Week, 7)
export const diffZonedDays = bindArgs(diffZonedDayLikeUnits, Unit.Day, 1)
export const diffZonedTimeUnits = diffTimeUnit // TODO: better type

export const diffPlainYears = bindArgs(diffPlainLargeUnits, Unit.Year)
export const diffPlainMonths = bindArgs(diffPlainLargeUnits, Unit.Month)
export const diffPlainWeeks = bindArgs(diffPlainDayLikeUnit, Unit.Week, 7)
export const diffPlainDays = bindArgs(diffPlainDayLikeUnit, Unit.Day, 1)
export const diffPlainTimeUnits = diffTimeUnit // TODO: better type

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
    calendarOps,
    timeZoneOps,
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

  return diffDateUnits(calendarOps, undefined, unit, record0, record1, options)
}

// Date Units (years, months, weeks, days)
// -----------------------------------------------------------------------------

/*
TODO: restore ability to diff by day (w/o calendar)... good for tree-shaking
*/
function diffDateUnits(
  calendarOps: DiffOps,
  timeZoneOps: TimeZoneOps | undefined,
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

  const startIsoDateTime = markerToIsoDateTime(timeZoneOps, marker0)
  const endIsoDateTime = markerToIsoDateTime(timeZoneOps, marker1)
  const [diffDate0, diffDate1] = prepareMarkerIsoDateTimeDiff(
    timeZoneOps,
    startIsoDateTime,
    endIsoDateTime,
    endEpochNano,
    sign,
  )

  const durationFields = diffDatesBig(calendarOps, diffDate0, diffDate1, unit)

  let res = totalRelativeDuration(
    durationFields,
    endEpochNano,
    unit,
    calendarOps,
    timeZoneOps,
    startIsoDateTime,
  )

  if (roundingInc) {
    res = roundByInc(res, roundingInc, roundingMode!)
  }

  return res
}

// Day-Like Units (weeks, days)
// -----------------------------------------------------------------------------

function diffZonedDayLikeUnits(
  unit: Unit.Week | Unit.Day,
  daysInUnit: number,
  record0: ZonedDateTimeSlots<string, string>,
  record1: ZonedDateTimeSlots<string, string>,
  options?: RoundingModeName | RoundingMathOptions | undefined,
): number {
  const [roundingInc, roundingMode] = refineUnitDiffOptions(unit, options)

  const timeZoneSlot = getCommonTimeZoneSlot(record0.timeZone, record1.timeZone)
  const timeZoneOps = queryNativeTimeZone(timeZoneSlot)

  const sign = compareBigNanos(
    record1.epochNanoseconds,
    record0.epochNanoseconds,
  )
  const [isoFields0, isoFields1, durationTimeNano] = prepareZonedEpochDiff(
    timeZoneOps,
    record0,
    record1,
    sign,
  )
  const nanoDiff = moveBigNano(
    diffBigNanos(isoToEpochNano(isoFields0)!, isoToEpochNano(isoFields1)!),
    durationTimeNano,
  )

  let res = bigNanoToExactDays(nanoDiff) / daysInUnit

  if (roundingInc) {
    res = roundByInc(res, roundingInc, roundingMode!)
  }

  return res
}

function diffPlainDayLikeUnit(
  unit: Unit.Week | Unit.Day,
  daysInUnit: number,
  record0: Marker,
  record1: Marker,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  const [roundingInc, roundingMode] = refineUnitDiffOptions(unit, options)
  const nanoDiff = diffBigNanos(
    markerToEpochNano(record0),
    markerToEpochNano(record1),
  )

  let res = bigNanoToExactDays(nanoDiff) / daysInUnit

  if (roundingInc) {
    res = roundByInc(res, roundingInc, roundingMode!)
  }

  return res
}

// Time Units
// -----------------------------------------------------------------------------

function diffTimeUnit(
  unit: TimeUnit,
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
