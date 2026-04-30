import {
  bigNanoToExactDays,
  bigNanoToNumber,
  compareBigNanos,
  diffBigNanos,
  moveBigNano,
} from '../internal/bigNano'
import {
  diffCalendarDates,
  getCommonCalendarId,
  getCommonTimeZoneId,
  prepareZonedEpochDiff,
} from '../internal/diff'
import { DurationFields } from '../internal/durationFields'
import { CalendarDateFields } from '../internal/fieldTypes'
import { moveDateTime, moveZonedEpochs } from '../internal/move'
import { RoundingMathOptions, RoundingModeName } from '../internal/optionsModel'
import { refineUnitDiffOptions } from '../internal/optionsRoundingRefine'
import { Marker, MarkerToEpochNano, MoveMarker } from '../internal/relativeMath'
import { roundBigNanoByInc, roundByInc } from '../internal/round'
import {
  AbstractDateSlots,
  ZonedDateTimeSlots,
  extractEpochNano,
} from '../internal/slots'
import { isoToEpochNano } from '../internal/timeMath'
import { queryTimeZone } from '../internal/timeZoneImpl'
import { totalRelativeDuration } from '../internal/total'
import { TimeUnit, Unit } from '../internal/units'
import { NumberSign, bindArgs } from '../internal/utils'

export const diffZonedYears = bindArgs(diffZonedLargeUnits, Unit.Year)
export const diffZonedMonths = bindArgs(diffZonedLargeUnits, Unit.Month)
export const diffZonedWeeks = bindArgs(diffZonedDayLikeUnits, Unit.Week, 7)
export const diffZonedDays = bindArgs(diffZonedDayLikeUnits, Unit.Day, 1)
export const diffZonedTimeUnits = bindArgs(
  diffTimeUnit,
  extractEpochNano as MarkerToEpochNano,
)

export const diffPlainYears = bindArgs(diffPlainLargeUnits, Unit.Year)
export const diffPlainMonths = bindArgs(diffPlainLargeUnits, Unit.Month)
export const diffPlainWeeks = bindArgs(
  diffPlainDayLikeUnit,
  isoToEpochNano as MarkerToEpochNano,
  Unit.Week,
  7,
)
export const diffPlainDays = bindArgs(
  diffPlainDayLikeUnit,
  isoToEpochNano as MarkerToEpochNano,
  Unit.Day,
  1,
)
export const diffPlainTimeUnits = bindArgs(
  diffTimeUnit,
  isoToEpochNano as MarkerToEpochNano,
)

// Large Units (years, months)
// -----------------------------------------------------------------------------

function diffZonedLargeUnits(
  unit: Unit,
  record0: ZonedDateTimeSlots,
  record1: ZonedDateTimeSlots,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  const timeZoneId = getCommonTimeZoneId(record0.timeZone, record1.timeZone)
  const timeZoneImpl = queryTimeZone(timeZoneId)

  const calendarId = getCommonCalendarId(record0.calendar, record1.calendar)

  return diffDateUnits(
    extractEpochNano as MarkerToEpochNano,
    bindArgs(prepareZonedEpochDiff, timeZoneImpl) as MarkersToIsoFields,
    bindArgs(moveZonedEpochs, timeZoneImpl, calendarId) as MoveMarker,
    (f0: CalendarDateFields, f1: CalendarDateFields) =>
      diffCalendarDates(calendarId, f0, f1, unit),
    unit,
    record0,
    record1,
    options,
  )
}

function diffPlainLargeUnits<S extends AbstractDateSlots>(
  unit: Unit,
  record0: S,
  record1: S,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  const calendarId = getCommonCalendarId(record0.calendar, record1.calendar)

  return diffDateUnits(
    isoToEpochNano as MarkerToEpochNano,
    identityMarkersToIsoFields as MarkersToIsoFields,
    bindArgs(moveDateTime, calendarId) as MoveMarker,
    (f0: CalendarDateFields, f1: CalendarDateFields) =>
      diffCalendarDates(calendarId, f0, f1, unit),
    unit,
    record0,
    record1,
    options,
  )
}

// Date Units (years, months, weeks, days)
// -----------------------------------------------------------------------------

type MarkersToIsoFields = (
  m0: Marker,
  m1: Marker,
  sign: NumberSign,
) => [CalendarDateFields, CalendarDateFields, ...any[]]

function identityMarkersToIsoFields(
  m0: CalendarDateFields,
  m1: CalendarDateFields,
): [CalendarDateFields, CalendarDateFields] {
  return [m0, m1]
}

function diffDateUnits(
  markerToEpochNano: MarkerToEpochNano,
  markersToIsoFields: MarkersToIsoFields,
  moveMarker: MoveMarker,
  diffIsoFields: (
    f0: CalendarDateFields,
    f1: CalendarDateFields,
  ) => DurationFields,
  unit: Unit, // guaranteed Y/M/W
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
    marker0,
    markerToEpochNano,
    moveMarker,
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
  record0: ZonedDateTimeSlots,
  record1: ZonedDateTimeSlots,
  options?: RoundingModeName | RoundingMathOptions | undefined,
): number {
  const [roundingInc, roundingMode] = refineUnitDiffOptions(unit, options)

  const timeZoneId = getCommonTimeZoneId(record0.timeZone, record1.timeZone)
  const timeZoneImpl = queryTimeZone(timeZoneId)

  const sign = compareBigNanos(
    record1.epochNanoseconds,
    record0.epochNanoseconds,
  )
  const [isoFields0, isoFields1, remainderNano] = prepareZonedEpochDiff(
    timeZoneImpl,
    record0,
    record1,
    sign,
  )
  const nanoDiff = moveBigNano(
    diffBigNanos(isoToEpochNano(isoFields0)!, isoToEpochNano(isoFields1)!),
    remainderNano,
  )

  let res = bigNanoToExactDays(nanoDiff) / daysInUnit

  if (roundingInc) {
    res = roundByInc(res, roundingInc, roundingMode!)
  }

  return res
}

function diffPlainDayLikeUnit(
  markerToEpochNano: MarkerToEpochNano,
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
  markerToEpochNano: MarkerToEpochNano,
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
