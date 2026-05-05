import {
  BigNano,
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
import { getInternalCalendar } from '../internal/externalCalendar'
import { timeFieldDefaults } from '../internal/fieldNames'
import { CalendarDateFields } from '../internal/fieldTypes'
import { combineDateAndTime } from '../internal/fieldUtils'
import { moveDate, moveDateTime, moveZonedEpochs } from '../internal/move'
import { RoundingMathOptions, RoundingModeName } from '../internal/optionsModel'
import { refineUnitDiffOptions } from '../internal/optionsRoundingRefine'
import {
  MarkerToEpochNano,
  MovableMarker,
  MoveMarker,
  createMarkerMoveOps,
  isZonedEpochSlots,
} from '../internal/relativeMath'
import { roundBigNanoByInc, roundByInc } from '../internal/round'
import {
  AbstractDateSlots,
  ZonedDateTimeSlots,
  extractEpochNano,
} from '../internal/slots'
import { isoDateTimeToEpochNano } from '../internal/timeMath'
import { queryTimeZone } from '../internal/timeZoneImpl'
import { totalRelativeDuration } from '../internal/total'
import { TimeUnit, Unit } from '../internal/units'
import { NumberSign, bindArgs } from '../internal/utils'

// TODO: Split the plain callers so each one passes a type-specific converter
// instead of branching here between date-only, date-time, and epoch markers.
function isoMarkerToEpochNano(marker: MovableMarker): BigNano {
  if (!isZonedEpochSlots(marker)) {
    return isoDateTimeToEpochNano(
      combineDateAndTime(marker, 'hour' in marker ? marker : timeFieldDefaults),
    )!
  }
  return marker.epochNanoseconds
}

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
  isoMarkerToEpochNano as MarkerToEpochNano,
  Unit.Week,
  7,
)
export const diffPlainDays = bindArgs(
  diffPlainDayLikeUnit,
  isoMarkerToEpochNano as MarkerToEpochNano,
  Unit.Day,
  1,
)
export const diffPlainTimeUnits = bindArgs(
  diffTimeUnit,
  isoMarkerToEpochNano as MarkerToEpochNano,
)

// Large Units (years, months)
// -----------------------------------------------------------------------------

function diffZonedLargeUnits(
  unit: Unit,
  record0: ZonedDateTimeSlots,
  record1: ZonedDateTimeSlots,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  const timeZoneId = getCommonTimeZoneId(record0.timeZoneId, record1.timeZoneId)
  const timeZoneImpl = queryTimeZone(timeZoneId)

  const calendarId = getCommonCalendarId(record0.calendarId, record1.calendarId)
  const calendar = getInternalCalendar(calendarId)

  return diffDateUnits(
    extractEpochNano as MarkerToEpochNano,
    bindArgs(
      prepareZonedEpochDiff,
      timeZoneImpl,
    ) as unknown as MarkersToIsoFields,
    bindArgs(moveZonedEpochs, timeZoneImpl, calendar) as MoveMarker,
    (f0: CalendarDateFields, f1: CalendarDateFields) =>
      diffCalendarDates(calendar, f0, f1, unit),
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
  const calendarId = getCommonCalendarId(record0.calendarId, record1.calendarId)
  const calendar = getInternalCalendar(calendarId)

  return diffDateUnits(
    isoMarkerToEpochNano as MarkerToEpochNano,
    identityMarkersToIsoFields as MarkersToIsoFields,
    bindArgs(
      'hour' in record0 ? moveDateTime : moveDate,
      calendar,
    ) as MoveMarker,
    (f0: CalendarDateFields, f1: CalendarDateFields) =>
      diffCalendarDates(calendar, f0, f1, unit),
    unit,
    record0,
    record1,
    options,
  )
}

// Date Units (years, months, weeks, days)
// -----------------------------------------------------------------------------

type MarkersToIsoFields = (
  m0: MovableMarker,
  m1: MovableMarker,
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
  marker0: MovableMarker,
  marker1: MovableMarker,
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
    createMarkerMoveOps(marker0, markerToEpochNano, moveMarker),
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

  const timeZoneId = getCommonTimeZoneId(record0.timeZoneId, record1.timeZoneId)
  const timeZoneImpl = queryTimeZone(timeZoneId)

  const sign = compareBigNanos(
    record1.epochNanoseconds,
    record0.epochNanoseconds,
  )
  const [isoFields0, isoFields1, remainderNano, startTime] =
    prepareZonedEpochDiff(timeZoneImpl, record0, record1, sign)
  const nanoDiff = moveBigNano(
    diffBigNanos(
      isoDateTimeToEpochNano(combineDateAndTime(isoFields0, startTime))!,
      isoDateTimeToEpochNano(combineDateAndTime(isoFields1, startTime))!,
    ),
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
  record0: MovableMarker,
  record1: MovableMarker,
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
  record0: MovableMarker,
  record1: MovableMarker,
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
