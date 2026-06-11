import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import { divideBigNanoToExactNumber } from '../../internal/bigNano'
import { type CalendarImpl } from '../../internal/calendarImpl'
import { diffCalendarDates, prepareZonedEpochDiff } from '../../internal/diff'
import { DurationFields } from '../../internal/durationFields'
import {
  isoDateTimeToEpochNano,
  isoDateToEpochNano,
} from '../../internal/epochMath'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
} from '../../internal/fieldTypes'
import { combineDateAndTime } from '../../internal/fieldUtils'
import { moveDate, moveDateTime, moveZonedEpochs } from '../../internal/move'
import { refineUnitDiffOptions } from '../../internal/optionsRoundingRefine'
import {
  MarkerToEpochNano,
  MovableMarker,
  MoveMarker,
  createMarkerMoveOps,
} from '../../internal/relativeMath'
import { roundBigNanoToInc, roundNumberToInc } from '../../internal/round'
import { getCommonCalendar, getCommonTimeZone } from '../../internal/slotUtils'
import { ZonedEpochNanoFields, getEpochNano } from '../../internal/slots'
import { totalRelativeDuration } from '../../internal/total'
import { TimeUnit, Unit, nanoInUtcDay } from '../../internal/units'
import { NumberSign, bindArgs, compareBigInts } from '../../internal/utils'

export const diffZonedYears = bindArgs(diffZonedLargeUnits, Unit.Year)
export const diffZonedMonths = bindArgs(diffZonedLargeUnits, Unit.Month)
export const diffZonedWeeks = bindArgs(diffZonedDayLikeUnits, Unit.Week, 7)
export const diffZonedDays = bindArgs(diffZonedDayLikeUnits, Unit.Day, 1)
export const diffZonedTimeUnits = bindArgs(
  diffTimeUnit,
  getEpochNano as MarkerToEpochNano,
)

export const diffPlainYears = bindArgs(diffPlainDateLargeUnits, Unit.Year)
export const diffPlainMonths = bindArgs(diffPlainDateLargeUnits, Unit.Month)
export const diffPlainDateTimeYears = bindArgs(
  diffPlainDateTimeLargeUnits,
  Unit.Year,
)
export const diffPlainDateTimeMonths = bindArgs(
  diffPlainDateTimeLargeUnits,
  Unit.Month,
)
export const diffPlainWeeks = bindArgs(
  diffPlainDayLikeUnit,
  isoDateTimeToEpochNano as MarkerToEpochNano,
  Unit.Week,
  7,
)
export const diffPlainDays = bindArgs(
  diffPlainDayLikeUnit,
  isoDateTimeToEpochNano as MarkerToEpochNano,
  Unit.Day,
  1,
)
export const diffPlainTimeUnits = bindArgs(
  diffTimeUnit,
  isoDateTimeToEpochNano as MarkerToEpochNano,
)

// Large Units (years, months)
// -----------------------------------------------------------------------------

function diffZonedLargeUnits(
  unit: Unit,
  record0: ZonedEpochNanoFields & { calendar: CalendarImpl },
  record1: ZonedEpochNanoFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  const timeZone = getCommonTimeZone(record0.timeZone, record1.timeZone)
  const calendar = getCommonCalendar(record0.calendar, record1.calendar)

  return diffDateUnits(
    getEpochNano as MarkerToEpochNano,
    bindArgs(prepareZonedEpochDiff, timeZone) as unknown as MarkersToIsoFields,
    bindArgs(moveZonedEpochs, timeZone, calendar) as MoveMarker,
    (f0: CalendarDateFields, f1: CalendarDateFields) =>
      diffCalendarDates(calendar, f0, f1, unit),
    unit,
    record0,
    record1,
    options,
  )
}

function diffPlainDateLargeUnits(
  unit: Unit,
  record0: CalendarDateFields & { calendar: CalendarImpl },
  record1: CalendarDateFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  const calendar = getCommonCalendar(record0.calendar, record1.calendar)

  return diffDateUnits(
    isoDateToEpochNano as MarkerToEpochNano,
    identityMarkersToIsoFields as MarkersToIsoFields,
    bindArgs(moveDate, calendar) as MoveMarker,
    // TODO: use bindArgs here too?
    (f0: CalendarDateFields, f1: CalendarDateFields) =>
      diffCalendarDates(calendar, f0, f1, unit),
    unit,
    record0,
    record1,
    options,
  )
}

function diffPlainDateTimeLargeUnits(
  unit: Unit,
  record0: CalendarDateTimeFields & { calendar: CalendarImpl },
  record1: CalendarDateTimeFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  const calendar = getCommonCalendar(record0.calendar, record1.calendar)

  return diffDateUnits(
    isoDateTimeToEpochNano as MarkerToEpochNano,
    identityMarkersToIsoFields as MarkersToIsoFields,
    bindArgs(moveDateTime, calendar) as MoveMarker,
    // TODO: use bindArgs here too?
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
  options: RoundingMathOptions | RoundingMode | undefined,
): number {
  const [roundingInc, roundingMode] = refineUnitDiffOptions(unit, options)
  const startEpochNano = markerToEpochNano(marker0)
  const endEpochNano = markerToEpochNano(marker1)

  const sign = compareBigInts(endEpochNano, startEpochNano)
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
    res = roundNumberToInc(res, roundingInc, roundingMode!)
  }

  return res
}

// Day-Like Units (weeks, days)
// -----------------------------------------------------------------------------

function diffZonedDayLikeUnits(
  unit: Unit.Week | Unit.Day,
  daysInUnit: number,
  record0: ZonedEpochNanoFields & { calendar: CalendarImpl },
  record1: ZonedEpochNanoFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode | undefined,
): number {
  const [roundingInc, roundingMode] = refineUnitDiffOptions(unit, options)

  const timeZone = getCommonTimeZone(record0.timeZone, record1.timeZone)

  const sign = compareBigInts(
    record1.epochNanoseconds,
    record0.epochNanoseconds,
  )
  const [isoFields0, isoFields1, remainderNano] = prepareZonedEpochDiff(
    timeZone,
    record0,
    record1,
    sign,
  )
  // `isoFields0` is the start date-time, so it supplies the original wall-clock
  // time for the adjusted end date. The start side already has that time.
  const nanoDiff =
    isoDateTimeToEpochNano(combineDateAndTime(isoFields1, isoFields0)) -
    isoDateTimeToEpochNano(isoFields0) +
    BigInt(remainderNano)

  let res = divideBigNanoToExactNumber(nanoDiff, nanoInUtcDay) / daysInUnit

  if (roundingInc) {
    res = roundNumberToInc(res, roundingInc, roundingMode!)
  }

  return res
}

function diffPlainDayLikeUnit(
  markerToEpochNano: MarkerToEpochNano,
  unit: Unit.Week | Unit.Day,
  daysInUnit: number,
  record0: MovableMarker,
  record1: MovableMarker,
  options?: RoundingMathOptions | RoundingMode,
): number {
  const [roundingInc, roundingMode] = refineUnitDiffOptions(unit, options)
  const nanoDiff = markerToEpochNano(record1) - markerToEpochNano(record0)

  let res = divideBigNanoToExactNumber(nanoDiff, nanoInUtcDay) / daysInUnit

  if (roundingInc) {
    res = roundNumberToInc(res, roundingInc, roundingMode!)
  }

  return res
}

// Time Units
// -----------------------------------------------------------------------------

// TODO: DRY with Instant's
function diffTimeUnit(
  markerToEpochNano: MarkerToEpochNano,
  unit: TimeUnit,
  nanoInUnit: number,
  record0: MovableMarker,
  record1: MovableMarker,
  options?: RoundingMathOptions | RoundingMode,
): number {
  const [roundingInc, roundingMode] = refineUnitDiffOptions(unit, options)

  let nanoDiff = markerToEpochNano(record1) - markerToEpochNano(record0)

  if (roundingInc) {
    nanoDiff = roundBigNanoToInc(
      nanoDiff,
      BigInt(nanoInUnit * roundingInc),
      roundingMode!,
    )
  }

  return roundingInc
    ? Number(nanoDiff / BigInt(nanoInUnit))
    : divideBigNanoToExactNumber(nanoDiff, nanoInUnit)
}
